// app/(tabs)/index.tsx
import AddCourseModal, { NotificationType } from '@/components/AddCourseModal';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import { auth, db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getCountFromServer, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ColorValue, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Dialog, IconButton, Modal, Paragraph, Portal, Snackbar, Text, Title, useTheme } from 'react-native-paper';

interface Course {
  id: string;
  name: string;
  groupName: string;
  teacherName: string;
  schoolYear: string;
  studentCount?: number;
}

const gradients: [ColorValue, ColorValue][] = [
  ['#43cea2', '#185a9d'],
  ['#ff5f6d', '#ffc371'],
  ['#8e2de2', '#4a00e0'],
  ['#00c6ff', '#0072ff'],
  ['#f7971e', '#ffd200'],
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales y diálogos
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Notificaciones
  const [notification, setNotification] = useState<{ visible: boolean; message: string; type: NotificationType | null }>({ visible: false, message: '', type: null });

  const showNotification = ({ message, type }: { message: string; type: NotificationType }) => {
    setNotification({ visible: true, message, type });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
        
        const unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
          const coursesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
          
          const coursesWithCounts = await Promise.all(coursesList.map(async (course) => {
            const studentsQuery = query(collection(db, 'students'), where('courseId', '==', course.id));
            const countSnapshot = await getCountFromServer(studentsQuery);
            return { ...course, studentCount: countSnapshot.data().count };
          }));

          setCourses(coursesWithCounts);
          setLoading(false);
        }, (error) => {
          console.error("Error al obtener cursos:", error);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setCurrentUser(null);
        setCourses([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Lógica de Acciones ---
  const handleAddNew = () => {
    setCourseToEdit(null);
    setAddEditModalVisible(true);
  };

  const handleLongPressCourse = (course: Course) => {
    setSelectedCourse(course);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    setCourseToEdit(selectedCourse);
    setAddEditModalVisible(true);
  };

  const handleDeletePress = () => {
    setActionModalVisible(false);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedCourse) return;
    try {
      const batch = writeBatch(db);
      const courseRef = doc(db, "courses", selectedCourse.id);
      batch.delete(courseRef);
      const studentsQuery = query(collection(db, 'students'), where('courseId', '==', selectedCourse.id));
      const studentsSnapshot = await getDocs(studentsQuery);
      studentsSnapshot.forEach(studentDoc => batch.delete(studentDoc.ref));
      await batch.commit();
      
      showNotification({ message: `Curso "${selectedCourse.name}" eliminado`, type: 'delete' });

    } catch (error) {
      console.error("Error al eliminar el curso y sus estudiantes:", error);
    } finally {
      setDeleteDialogVisible(false);
      setSelectedCourse(null);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, Cerrar Sesión", style: "destructive", onPress: () => signOut(auth) }
      ]
    );
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) { return <View style={styles.centerScreen}><ActivityIndicator size="large" /></View>; }

  const snackbarStyles = {
    success: { backgroundColor: '#28a745' },
    update: { backgroundColor: '#007bff' },
    delete: { backgroundColor: '#dc3545' },
  };
  const snackbarIcon: Record<NotificationType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    success: 'check-circle-outline',
    update: 'information-outline',
    delete: 'alert-circle-outline',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{currentUser?.displayName || 'Profesor'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Avatar.Icon size={48} icon="account-circle" style={styles.avatar} />
          <IconButton
            icon="logout"
            size={28}
            iconColor="#555"
            onPress={handleSignOut}
          />
        </View>
      </View>
      
      <FlatList
        data={courses}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/course/${item.id}`)}
            onLongPress={() => handleLongPressCourse(item)}
          >
            <CourseCard course={item} gradient={gradients[index % gradients.length]} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            <Text style={styles.listTitle}>Mis Cursos</Text>
            <Button
              icon="plus"
              mode="contained"
              onPress={handleAddNew}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Añadir
            </Button>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* --- El FAB se ha eliminado --- */}

      {currentUser && (
        <AddCourseModal
          visible={addEditModalVisible}
          onDismiss={() => setAddEditModalVisible(false)}
          teacherId={currentUser.uid}
          teacherName={currentUser.displayName || 'Profesor'}
          courseToEdit={courseToEdit}
          onSaveSuccess={showNotification}
        />
      )}

      <Portal>
        <Modal visible={actionModalVisible} onDismiss={() => setActionModalVisible(false)} contentContainerStyle={styles.actionModalContainer}>
          <Title style={styles.actionModalTitle}>{selectedCourse?.name}</Title>
          <Button icon="pencil-outline" mode="contained" onPress={handleEdit} style={styles.actionModalButton}>Editar Curso</Button>
          <Button icon="trash-can-outline" mode="contained" onPress={handleDeletePress} style={[styles.actionModalButton, {backgroundColor: theme.colors.error}]}>Eliminar Curso</Button>
        </Modal>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Confirmar Eliminación</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              ¿Estás seguro? Se eliminará el curso <Text style={{fontWeight: 'bold'}}>{selectedCourse?.name}</Text> y **todos sus estudiantes**. Esta acción es irreversible.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={notification.visible}
        onDismiss={() => setNotification({ ...notification, visible: false })}
        duration={3000}
        style={[styles.snackbar, notification.type ? snackbarStyles[notification.type] : {}]}
      >
        <View style={styles.snackbarContent}>
          <MaterialCommunityIcons 
            name={notification.type ? snackbarIcon[notification.type] : 'information'} 
            size={20} 
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.snackbarText}>{notification.message}</Text>
        </View>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' },
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, },
  greeting: { fontSize: 18, color: '#888', },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#333', },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: '#e0e0e0' },
  // --- NUEVOS ESTILOS PARA LA CABECERA DE LA LISTA Y EL BOTÓN ---
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginTop: 10,
    marginBottom: 20,
  },
  listTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#444',
  },
  addButton: {
    backgroundColor: '#185a9d',
    borderRadius: 20, // Forma de píldora
  },
  addButtonLabel: {
    fontWeight: 'bold',
  },
  // --- FIN DE NUEVOS ESTILOS ---
  listContent: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 20, // Reducimos el padding ya que no hay FAB
  },
  actionModalContainer: { backgroundColor: '#f7f8fa', paddingVertical: 30, paddingHorizontal: 20, margin: 20, borderRadius: 20, },
  actionModalTitle: { textAlign: 'center', marginBottom: 20, fontSize: 24, fontWeight: 'bold', },
  actionModalButton: { marginBottom: 10, paddingVertical: 5, borderRadius: 50, },
  dialogTitle: { fontWeight: 'bold', },
  snackbar: { borderRadius: 10, margin: 10, },
  snackbarContent: { flexDirection: 'row', alignItems: 'center', },
  snackbarText: { color: '#fff', fontWeight: 'bold', },
});