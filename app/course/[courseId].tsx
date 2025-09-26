import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, DocumentSnapshot, getDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Card, List, Text } from 'react-native-paper';
import AddStudentModal from '../../components/AddStudentModal';
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

  useEffect(() => {
    if (!courseId) return;
    const courseRef = doc(db, 'courses', courseId);
    
    const unsubscribeCourse = onSnapshot(courseRef, (docSnap) => {
      if (docSnap.exists()) {
        const courseData = docSnap.data() as Course;
        setCourse(courseData);
        
        if (courseData.studentIds && courseData.studentIds.length > 0) {
          const studentPromises = courseData.studentIds.map(id => getDoc(doc(db, 'students', id)));
          Promise.all(studentPromises).then(studentSnaps => {
            const studentList = studentSnaps
              .filter(snap => snap.exists())
              .map((snap: DocumentSnapshot) => ({ id: snap.id, ...snap.data() } as Student));
            setStudents(studentList);
          });
        } else {
          setStudents([]);
        }
      } else {
        console.log("No se encontró el curso!");
      }
      setIsLoading(false);
    });

    return () => unsubscribeCourse();
  }, [courseId]);

  const handleSaveStudent = async (studentData: { fullName: string; studentId: string }) => {
    if (!courseId) return;
    const batch = writeBatch(db);
    const studentDocRef = doc(db, 'students', studentData.studentId);
    batch.set(studentDocRef, { fullName: studentData.fullName, studentId: studentData.studentId });
    const courseDocRef = doc(db, 'courses', courseId);
    batch.update(courseDocRef, { studentIds: arrayUnion(studentData.studentId) });
    try {
      await batch.commit();
      setStudentModalVisible(false);
    } catch (error) {
      console.error("Error al añadir estudiante: ", error);
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

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
                <Button
                  icon="qrcode-scan"
                  mode="contained"
                  onPress={() => router.push({ pathname: '/scanner', params: { courseId } })}
                  style={styles.mainButton}
                  labelStyle={{ paddingVertical: 10, fontSize: 18 }}
                >
                  Iniciar Pase de Lista
                </Button>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Historial</Text>
                {/* 👇 BOTÓN CORREGIDO 👇 */}
                <Button
                  icon="history"
                  mode="outlined"
                  onPress={() => router.push({ 
                    pathname: "/attendanceHistory/[courseId]", 
                    params: { courseId } 
                  })}
                  style={{ marginTop: 16 }}
                >
                  Ver Historial de Asistencia
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
        ListEmptyComponent={<Text style={styles.placeholderText}>No hay estudiantes inscritos.</Text>}
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
  content: { paddingBottom: 20 },
  card: { marginHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: 'bold' },
  mainButton: { marginTop: 16, borderRadius: 30 },
  placeholderText: { marginTop: 20, color: 'gray', textAlign: 'center', fontStyle: 'italic' },
});

export default CourseDetailScreen;