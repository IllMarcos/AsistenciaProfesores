// functions/src/index.ts
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Se importa la librería para forzar la zona horaria
import { formatInTimeZone } from "date-fns-tz";

admin.initializeApp();
const db = admin.firestore();

// --- NUEVA FUNCIÓN PARA CORREGIR LA FECHA DE ASISTENCIA ---
// Se activa cada vez que se crea un nuevo documento en la colección 'attendance'
export const setCorrectAttendanceDate = onDocumentCreated("attendance/{attendanceId}", async (event) => {
  logger.info("Activada la función setCorrectAttendanceDate para el documento:", event.params.attendanceId);

  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No hay datos en el evento, saliendo.");
    return;
  }

  const attendanceData = snapshot.data();
  
  // Verificamos si el campo 'date' ya fue establecido para no entrar en un bucle infinito
  if (attendanceData.date) {
    logger.log("El documento ya tiene una fecha establecida. Saliendo de la función.");
    return;
  }
  
  // Obtenemos el timestamp que la app guardó
  const timestamp = attendanceData.timestamp.toDate();
  
  // Definimos explícitamente la zona horaria de Mazatlán
  const timeZone = "America/Mazatlan";
  
  // Convertimos el timestamp a la fecha correcta en formato YYYY-MM-DD para esa zona horaria
  const correctDateString = formatInTimeZone(timestamp, timeZone, "yyyy-MM-dd");

  logger.info(`Timestamp: ${timestamp}, Zona Horaria: ${timeZone}, Fecha calculada: ${correctDateString}`);

  // Actualizamos el documento con la fecha correcta
  try {
    await db.collection("attendance").doc(event.params.attendanceId).update({
      date: correctDateString,
    });
    logger.log("Documento actualizado con éxito con la fecha:", correctDateString);
  } catch (error) {
    logger.error("Error al actualizar el documento:", error);
  }
});


// --- TU FUNCIÓN EXISTENTE PARA GENERAR REPORTES CSV ---
interface CsvRequestData {
  courseId: string;
  month: string; // ex. "2024-11"
}

export const generateCsvReport = functions.https.onCall(async (data: CsvRequestData, context: functions.https.CallableContext) => {
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
    const allStudents = studentDocs.map((doc) => doc.data()!).filter(Boolean);

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
    dateColumns.sort();

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
      csv += `${totalAsistencia},\n`;
    });

    return { csv };
  } catch (error) {
    logger.error("Error generating report:", error);
    throw new functions.https.HttpsError("internal", "Ocurrió un error al generar el reporte.");
  }
});