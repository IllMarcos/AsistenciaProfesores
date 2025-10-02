// app/(tabs)/index.tsx
import ActionConfirmationModal from '@/components/ActionConfirmationModal';
import AddCourseModal from '@/components/AddCourseModal';
import ConfirmationModal, { ConfirmationStatus } from '@/components/ConfirmationModal';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import { auth, db } from '@/firebaseConfig';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ColorValue, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, IconButton, Modal, Portal, Text, Title, useTheme } from 'react-native-paper';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface Course {
  id: string;
  name: string;
  groupName: string;
  teacherName: string;
  schoolYear: string;
  studentCount?: number;
}

const gradients: [ColorValue, ColorValue][] = [
  ['#43cea2', '#185a9d'], ['#ff5f6d', '#ffc371'], ['#8e2de2', '#4a00e0'],
  ['#00c6ff', '#0072ff'], ['#f7971e', '#ffd200'],
];

const CourseListItem = ({ item, index, onLongPress, onPress }: { item: Course, index: number, onLongPress: (course: Course) => void, onPress: (course: Course) => void }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
    opacity.value = withTiming(0.8, { duration: 100 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 200 });
  };
  return (
    <Pressable onPress={() => onPress(item)} onLongPress={() => onLongPress(item)} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <CourseCard course={item} gradient={gradients[index % gradients.length]} animatedStyle={animatedStyle} />
    </Pressable>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{
    visible: boolean;
    status: ConfirmationStatus;
    message: string;
  }>({ visible: false, status: 'loading', message: '' });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        
        const q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
        
        const unsubscribeCourses = onSnapshot(q, (snapshot) => {
          const coursesList = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            studentCount: doc.data().studentCount || 0 
          } as Course));
          setCourses(coursesList);
          setLoading(false);
        }, (error) => {
          console.error("Error al obtener cursos:", error);
          setLoading(false);
        });

        return () => unsubscribeCourses();
      } else {
        setCurrentUser(null);
        setCourses([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleAddNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCourseToEdit(null);
    setAddEditModalVisible(true);
  };

  const handleLongPressCourse = (course: Course) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedCourse(course);
    setActionModalVisible(true);
  };
  
  const handlePressCourse = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    setCourseToEdit(selectedCourse);
    setAddEditModalVisible(true);
  };

  const handleDeletePress = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedCourse) return;
    setDeleteModalVisible(false);
    setConfirmationState({ visible: true, status: 'loading', message: 'Eliminando curso...' });
    try {
      const batch = writeBatch(db);
      const courseRef = doc(db, "courses", selectedCourse.id);
      
      const studentsQuery = query(collection(db, 'students'), where('courseId', '==', selectedCourse.id));
      const studentsSnapshot = await getDocs(studentsQuery);
      studentsSnapshot.forEach(studentDoc => batch.delete(studentDoc.ref));
      
      batch.delete(courseRef);
      
      await batch.commit();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmationState({ visible: true, status: 'success', message: '¡Eliminado!' });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Error al eliminar el curso y sus estudiantes:", error);
      setConfirmationState({ visible: true, status: 'error', message: 'Error al eliminar' });
    } finally {
      setSelectedCourse(null);
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = () => {
    signOut(auth);
    setSignOutModalVisible(false);
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // --- LÓGICA PARA OBTENER EL PRIMER NOMBRE ---
  const userFirstName = currentUser?.displayName?.split(' ')[0] || 'Profesor';

  if (loading) { return <View style={styles.centerScreen}><ActivityIndicator size="large" /></View>; }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          {/* Se muestra la nueva variable con el primer nombre */}
          <Text style={styles.userName}>{userFirstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Avatar.Icon size={48} icon="account-circle" style={styles.avatar} />
          <IconButton icon="logout" size={28} iconColor="#555" onPress={handleSignOut} />
        </View>
      </View>
      
      <FlatList
        data={courses}
        renderItem={({ item, index }) => (
          <CourseListItem item={item} index={index} onPress={handlePressCourse} onLongPress={handleLongPressCourse} />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            <Text style={styles.listTitle}>Mis Cursos</Text>
            <Button icon="plus" mode="contained" onPress={handleAddNew} style={styles.addButton} labelStyle={styles.addButtonLabel}>Añadir</Button>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {currentUser && <AddCourseModal visible={addEditModalVisible} onDismiss={() => setAddEditModalVisible(false)} teacherId={currentUser.uid} teacherName={currentUser.displayName || ''} courseToEdit={courseToEdit} onSaveSuccess={() => {}} />}

      <Portal>
        <ConfirmationModal
          visible={confirmationState.visible}
          status={confirmationState.status}
          message={confirmationState.message}
          onDismiss={() => setConfirmationState({ ...confirmationState, visible: false })}
        />

        <ActionConfirmationModal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          onConfirm={confirmDelete}
          title="Confirmar Eliminación"
          message={
            <>
              ¿Estás seguro? Se eliminará el curso <Text style={{ fontWeight: 'bold' }}>{selectedCourse?.name || ''}</Text> y todos sus estudiantes. Esta acción es irreversible.
            </>
          }
          confirmButtonText="Eliminar"
          confirmButtonColor="#dc3545"
          icon="alert-circle-outline"
          iconColor="#dc3545"
        />

        <ActionConfirmationModal
          visible={signOutModalVisible}
          onDismiss={() => setSignOutModalVisible(false)}
          onConfirm={confirmSignOut}
          title="Cerrar Sesión"
          message="¿Estás seguro de que quieres cerrar tu sesión?"
          confirmButtonText="Sí, Cerrar Sesión"
          confirmButtonColor={theme.colors.error}
          icon="logout"
          iconColor="#555"
        />

        <Modal visible={actionModalVisible} onDismiss={() => setActionModalVisible(false)} contentContainerStyle={styles.actionModalContainer}>
          <Title style={styles.actionModalTitle}>{selectedCourse?.name}</Title>
          <Button icon="pencil-outline" mode="contained" onPress={handleEdit} style={styles.actionModalButton}>Editar Curso</Button>
          <Button icon="trash-can-outline" mode="contained" onPress={handleDeletePress} style={[styles.actionModalButton, {backgroundColor: theme.colors.error}]}>Eliminar Curso</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' },
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  header: { paddingTop: hp('7%'), paddingHorizontal: wp('5%'), paddingBottom: hp('2.5%'), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomLeftRadius: wp('8%'), borderBottomRightRadius: wp('8%'), shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, },
  greeting: { fontSize: hp('2.2%'), color: '#888' },
  userName: { fontSize: hp('3.5%'), fontWeight: 'bold', color: '#333' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: '#e0e0e0' },
  listHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp('1%'), marginTop: hp('1.5%'), marginBottom: hp('2.5%'), },
  listTitle: { fontSize: hp('2.8%'), fontWeight: '700', color: '#444', },
  addButton: { backgroundColor: '#185a9d', borderRadius: wp('5%'), },
  addButtonLabel: { fontWeight: 'bold', },
  listContent: { paddingHorizontal: wp('5%'), paddingTop: hp('1.5%'), paddingBottom: hp('3%'), },
  actionModalContainer: { backgroundColor: '#f7f8fa', paddingVertical: hp('4%'), paddingHorizontal: wp('5%'), marginHorizontal: wp('5%'), borderRadius: wp('5%'), },
  actionModalTitle: { textAlign: 'center', marginBottom: hp('2.5%'), fontSize: hp('3%'), fontWeight: 'bold', },
  actionModalButton: { marginBottom: hp('1.5%'), paddingVertical: hp('0.6%'), borderRadius: wp('10%'), },
});