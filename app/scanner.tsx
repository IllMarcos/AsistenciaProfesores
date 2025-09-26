// app/scanner.tsx

import { Camera, CameraView } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { db } from '../firebaseConfig';

interface Student {
  fullName: string;
  studentId: string;
}

const ScannerScreen = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);

  // 1. Pedir permiso para la cámara al cargar la pantalla
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  // 2. Cargar la lista de estudiantes del curso UNA SOLA VEZ para validaciones rápidas
  useEffect(() => {
    const fetchCourseStudents = async () => {
      if (!courseId) return;
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);

      if (courseSnap.exists()) {
        const studentIds = courseSnap.data().studentIds || [];
        if (studentIds.length > 0) {
          // Si tenemos estudiantes, los cargamos para tener sus nombres
          const studentsSnap = await getDoc(doc(db, 'students', studentIds[0])); // Esto necesitaría una query 'in' para muchos
          // Por ahora, asumimos que tenemos una lista de estudiantes.
          // En una app real, aquí haríamos una query `where('studentId', 'in', studentIds)`
          // Para este ejemplo, vamos a cargar todos los estudiantes y filtrar localmente.
          const tempStudents: Student[] = []; // Aquí iría la data real
          // ... Lógica para poblar tempStudents
          setCourseStudents(tempStudents);
        }
      }
    };
    // Esta es una simplificación. Lo ideal es tener la lista de estudiantes del curso ya cargada.
    // Vamos a asumir que la validación se hace contra la data del curso.
  }, [courseId]);


  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true); // Pausamos el escáner para procesar
    const studentId = data;

    // 3. Validar si el estudiante pertenece al curso
    const courseRef = doc(db, 'courses', courseId!);
    const courseSnap = await getDoc(courseRef);
    const studentIds = courseSnap.exists() ? courseSnap.data().studentIds : [];

    if (!studentIds.includes(studentId)) {
      setFeedback({ message: `QR Inválido o Estudiante no inscrito`, isError: true });
    } else {
      // 4. Registrar la asistencia
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const attendanceDocId = `${courseId}_${today}`;
      const attendanceRef = doc(db, 'attendanceRecords', attendanceDocId);

      try {
        // setDoc con merge:true crea el documento si no existe, o lo actualiza si ya existe.
        // arrayUnion añade el ID del estudiante al array solo si no está ya presente.
        await setDoc(attendanceRef, {
          courseId: courseId,
          date: today,
          presentStudentIds: arrayUnion(studentId)
        }, { merge: true });

        // Buscamos el nombre del estudiante para el feedback
        const studentRef = doc(db, 'students', studentId);
        const studentSnap = await getDoc(studentRef);
        const studentName = studentSnap.exists() ? studentSnap.data().fullName : studentId;

        setFeedback({ message: `✅ ${studentName}`, isError: false });
      } catch (error) {
        setFeedback({ message: 'Error al guardar', isError: true });
        console.error(error);
      }
    }
    
    // 5. Reactivar el escáner después de un momento
    setTimeout(() => {
      setScanned(false);
      setFeedback(null);
    }, 2000);
  };

  if (hasPermission === null) {
    return <Text>Solicitando permiso para la cámara...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No tienes acceso a la cámara.</Text>;
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Overlay de feedback */}
      {feedback && (
        <View style={styles.feedbackOverlay}>
          <Text style={[styles.feedbackText, { color: feedback.isError ? '#B00020' : '#00BFA5' }]}>
            {feedback.message}
          </Text>
        </View>
      )}

      {/* Guía visual para el escáner */}
      <View style={styles.scannerGuideOverlay}>
        <View style={styles.scannerGuideBox} />
      </View>

      <Appbar.Header style={{ backgroundColor: 'transparent' }}>
        <Appbar.Action icon="close" onPress={() => router.back()} color="white" />
      </Appbar.Header>
    </View>
  );
};

const styles = StyleSheet.create({
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
  scannerGuideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerGuideBox: {
    width: 250,
    height: 250,
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 10,
  },
});

export default ScannerScreen;