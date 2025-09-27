import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

// Define an interface for the expected input data
interface CsvRequestData {
  courseId: string;
  month: string; // ex. "2024-11"
}

// 👇 CORRECTION: Use 'functions.https.CallableContext' for the context type
export const generateCsvReport = functions.https.onCall(async (data: CsvRequestData, context: functions.https.CallableContext) => {
  // Verificación de autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado para realizar esta acción.",
    );
  }

  const { courseId, month } = data;
  if (!courseId || !month) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "La función fue llamada sin los parámetros 'courseId' y 'month'.",
    );
  }

  try {
    // 1. Obtener datos del curso y estudiantes
    const courseRef = db.collection("courses").doc(courseId);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      throw new functions.https.HttpsError("not-found", "El curso solicitado no fue encontrado.");
    }
    const courseData = courseSnap.data()!;
    const allStudentIds: string[] = courseData.studentIds || [];

    if (allStudentIds.length === 0) {
      return { csv: "No.,Nombre del Alumno\n(No hay estudiantes inscritos en este curso)" };
    }

    const studentRefs = allStudentIds.map((id) => db.collection("students").doc(id));
    const studentDocs = await db.getAll(...studentRefs);
    const allStudents = studentDocs.map((doc) => doc.data()!).filter(Boolean); // filter(Boolean) removes any undefined students

    // 2. Obtener los registros de asistencia del mes
    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    const attendanceQuery = db.collection("attendanceRecords")
      .where("courseId", "==", courseId)
      .where("date", ">=", startDate.toISOString().split("T")[0])
      .where("date", "<", endDate.toISOString().split("T")[0]);

    const attendanceSnap = await attendanceQuery.get();
    const attendanceRecords = new Map<string, string[]>();
    const dateColumns: string[] = [];

    attendanceSnap.forEach((doc) => {
      const data = doc.data();
      if (data.date && !dateColumns.includes(data.date)) {
        attendanceRecords.set(data.date, data.presentStudentIds);
        dateColumns.push(data.date);
      }
    });
    dateColumns.sort(); // Ensure chronological order

    // 3. Construir el CSV
    let csv = `No.,Nombre del Alumno,${dateColumns.join(",")},Total Asistencia,Total Practicas\n`;

    allStudents.forEach((student, index) => {
      if (!student) return;
      let totalAsistencia = 0;
      csv += `${index + 1},"${student.fullName}",`;
      dateColumns.forEach((date) => {
        const presentIds = attendanceRecords.get(date) || [];
        if (presentIds.includes(student.studentId)) {
          csv += "*,";
          totalAsistencia++;
        } else {
          csv += "|,";
        }
      });
      csv += `${totalAsistencia},\n`; // Columna de practicas vacía
    });

    return { csv };
  } catch (error) {
    console.error("Error generating report:", error);
    throw new functions.https.HttpsError("internal", "Ocurrió un error al generar el reporte.");
  }
});