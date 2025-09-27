// app/(tabs)/index.tsx
import AddCourseModal from '@/components/AddCourseModal';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import { auth, db } from '@/firebaseConfig';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, FAB, Text } from 'react-native-paper';

interface Course {
  id: string;
  name: string;
  groupName: string;
  teacherName: string;
  studentCount?: number;
}

// Paleta de gradientes para las tarjetas
const gradients = [
  ['#43cea2', '#185a9d'],
  ['#ff5f6d', '#ffc371'],
  ['#8e2de2', '#4a00e0'],
  ['#00c6ff', '#0072ff'],
  ['#f7971e', '#ffd200'],
];

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const coursesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Course));
          setCourses(coursesList);
          setLoading(false);
        }, () => setLoading(false));

        return () => unsubscribeSnapshot();
      } else {
        setCurrentUser(null);
        setCourses([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return <View style={styles.centerScreen}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* --- Encabezado --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{currentUser?.displayName || 'Profesor'}</Text>
        </View>
        <Avatar.Icon size={48} icon="account-circle" style={styles.avatar} />
      </View>

      {/* --- Lista de Cursos --- */}
      <FlatList
        data={courses}
        renderItem={({ item, index }) => (
          <CourseCard course={item} gradient={gradients[index % gradients.length]} />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.listTitle}>Mis Cursos</Text>}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* --- Botón Flotante --- */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => setModalVisible(true)}
      />

      {/* --- Modal --- */}
      {currentUser && (
        <AddCourseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          teacherId={currentUser.uid}
          teacherName={currentUser.displayName || 'Profesor'}
        />
      )}
    </View>
  );
}

// Estilos completamente renovados
const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' },
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    paddingTop: 60, // Mayor espacio para la barra de estado
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  greeting: {
    fontSize: 18,
    color: '#888',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  avatar: {
    backgroundColor: '#e0e0e0',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#444',
    paddingHorizontal: 5,
    marginBottom: 20,
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // Espacio amplio para el FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#185a9d', // Un color del gradiente
    borderRadius: 30,
  },
});