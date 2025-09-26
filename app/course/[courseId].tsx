// app/course/[courseId].tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Card, List, Text } from 'react-native-paper';
import AddStudentModal from '../../components/AddStudentModal'; // Importamos el nuevo modal
import { db } from '../../firebaseConfig';

// Interfaces para tipado
interface Course {
  name: string;
  groupName: string;
  schoolYear: string;
  studentIds: string[];
}

interface Student {
    id: string;
    fullName: string;
    studentId: string;
}

const CourseDetailScreen = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentModalVisible, setStudentModalVisible] = useState(false);

  // Efecto para obtener los datos del curso
  useEffect(() => {
    if (!courseId) return;
    const docRef = doc(db, 'courses', courseId);
    
    // Usamos onSnapshot para que los datos del curso (como la lista de IDs) se actualicen en tiempo real
    const unsubscribeCourse = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCourse({ ...docSnap.data() } as Course);
      } else {
        console.log("No se encontró el curso!");
      }
      setIsLoading(false);
    });

    return () => unsubscribeCourse();
  }, [courseId]);

  // Efecto para obtener los detalles de los estudiantes una vez que tenemos sus IDs
  useEffect(() => {
    if (!course?.studentIds || course.studentIds.length === 0) {
        setStudents([]); // Si no hay IDs, la lista de estudiantes está vacía
        return;
    }

    const q = query(collection(db, 'students'), where('studentId', 'in', course.studentIds));
    const unsubscribeStudents = onSnapshot(q, (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentList);
    });

    return () => unsubscribeStudents();
  }, [course]); // Se ejecuta cada vez que los datos del curso cambian

  const handleSaveStudent = async (studentData: { fullName: string; studentId: string }) => {
    if (!courseId) return;

    // Usamos un "batch write" para asegurar que ambas operaciones (crear y actualizar)
    // se completen exitosamente o ninguna lo haga.
    const batch = writeBatch(db);

    // 1. Referencia al nuevo documento en la colección 'students'
    const studentDocRef = doc(db, 'students', studentData.studentId);
    batch.set(studentDocRef, { fullName: studentData.fullName, studentId: studentData.studentId });

    // 2. Referencia al documento del curso actual para actualizarlo
    const courseDocRef = doc(db, 'courses', courseId);
    batch.update(courseDocRef, { studentIds: arrayUnion(studentData.studentId) });

    try {
      await batch.commit(); // Ejecutamos ambas operaciones
      setStudentModalVisible(false); // Cerramos el modal
    } catch (error) {
      console.error("Error al añadir estudiante: ", error);
      // Aquí podrías mostrar una alerta o modal de error
    }
  };


  if (isLoading) {
    return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
  }

  if (!course) {
    return <View style={styles.container}><Text>Curso no encontrado.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={course.name} subtitle={course.groupName} />
      </Appbar.Header>

      {/* Usamos un FlatList como contenedor principal para poder hacer scroll */}
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
            <List.Item
                title={item.fullName}
                description={`ID: ${item.studentId}`}
                left={props => <List.Icon {...props} icon="account" />}
            />
        )}
        ListHeaderComponent={
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Asistencia</Text>
                <Button icon="qrcode-scan" mode="contained" onPress={() => {}} style={styles.mainButton} labelStyle={{ paddingVertical: 10, fontSize: 18 }}>
                  Iniciar Pase de Lista
                </Button>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text variant="titleLarge" style={styles.sectionTitle}>Estudiantes ({students.length})</Text>
                  <Button icon="plus-circle" mode="contained-tonal" onPress={() => setStudentModalVisible(true)}>
                    Añadir
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </>
        }
        ListEmptyComponent={
            <Text style={styles.placeholderText}>No hay estudiantes inscritos en este curso.</Text>
        }
        contentContainerStyle={styles.content}
      />

      <AddStudentModal
        visible={isStudentModalVisible}
        onDismiss={() => setStudentModalVisible(false)}
        onSave={handleSaveStudent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: 'bold' },
  mainButton: { marginTop: 16, borderRadius: 30 },
  placeholderText: { marginTop: 20, color: 'gray', textAlign: 'center', fontStyle: 'italic' },
});

export default CourseDetailScreen;