// app/(tabs)/index.tsx

import { Link } from 'expo-router'; // Importamos Link para la navegación
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Card, FAB, Text } from 'react-native-paper';
import AddCourseModal from '../../components/AddCourseModal'; // Importamos el componente modal
import { auth, db } from '../../firebaseConfig';

// Definimos una interfaz para la estructura de un curso
interface Course {
  id: string;
  name: string;
  groupName: string;
  schoolYear: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Nos aseguramos de que el usuario esté autenticado antes de hacer la consulta
    if (!auth.currentUser) {
        setIsLoading(false);
        return;
    };

    // Creamos una consulta para obtener solo los cursos del profesor actual
    const q = query(collection(db, 'courses'), where('teacherId', '==', auth.currentUser.uid));

    // onSnapshot crea un listener en tiempo real. ¡La lista se actualizará sola!
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const coursesData: Course[] = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(coursesData);
      setIsLoading(false);
    }, (error) => {
        // Manejo de errores de la consulta
        console.error("Error al obtener los cursos: ", error);
        setIsLoading(false);
    });

    // Limpiamos el listener al desmontar el componente para evitar fugas de memoria
    return () => unsubscribe();
  }, []);

  const handleSaveCourse = async (courseData: { name: string; groupName: string; schoolYear: string }) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'courses'), {
        ...courseData,
        teacherId: auth.currentUser.uid,
        studentIds: [], // Inicializamos la lista de estudiantes vacía
      });
      setModalVisible(false); // Cerramos el modal al guardar exitosamente
    } catch (error) {
      console.error("Error al guardar el curso: ", error);
      // Aquí se podría mostrar un modal o notificación de error al usuario
    }
  };

  if (isLoading) {
    return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title={`Mis Cursos (${courses.length})`} />
      </Appbar.Header>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/course/[courseId]", params: { courseId: item.id } }} asChild>
            <Card style={styles.card}>
              <Card.Title
                title={item.name}
                subtitle={`${item.groupName} - ${item.schoolYear}`}
              />
            </Card>
          </Link>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall">No tienes cursos</Text>
            <Text variant="bodyMedium">Presiona el botón + para añadir tu primer curso.</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      <AddCourseModal
        visible={isModalVisible}
        onDismiss={() => setModalVisible(false)}
        onSave={handleSaveCourse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginHorizontal: 16, marginTop: 16, elevation: 2 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, textAlign: 'center' },
});