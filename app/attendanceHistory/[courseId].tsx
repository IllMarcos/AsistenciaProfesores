// app/attendanceHistory/[courseId].tsx
import { db } from '@/firebaseConfig';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Divider, IconButton, Text, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AttendanceRecord {
  id: string;
  studentName: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Course {
  name: string;
}

interface SectionData {
  title: string;
  data: AttendanceRecord[];
}

export default function AttendanceHistoryScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    // Obtener nombre del curso
    const courseRef = doc(db, 'courses', courseId);
    const unsubscribeCourse = onSnapshot(courseRef, (doc) => {
      if (doc.exists()) setCourse(doc.data() as Course);
    });

    // Consulta para obtener el historial de asistencia, ordenado por fecha
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('courseId', '==', courseId),
      orderBy('timestamp', 'desc') // Ordenar por más reciente primero
    );

    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));
      setAttendance(attendanceList);
      setLoading(false);
    }, (error) => {
      console.error("ERROR: Firestore query failed. This is likely due to a missing index. Please check the console for a link to create it.", error);
      setLoading(false);
    });

    return () => {
      unsubscribeCourse();
      unsubscribeAttendance();
    };
  }, [courseId]);

  // Agrupar los registros de asistencia por fecha
  const sections = useMemo(() => {
    const grouped: { [key: string]: AttendanceRecord[] } = attendance.reduce((acc, record) => {
      const date = new Date(record.timestamp.seconds * 1000);
      const dateString = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(record);
      return acc;
    }, {} as { [key: string]: AttendanceRecord[] });

    return Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date],
    }));
  }, [attendance]);

  if (loading) {
    return <View style={styles.centerScreen}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#333"
          size={28}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <View style={styles.headerTitleContainer}>
          <Title style={styles.courseTitle}>Historial de Asistencia</Title>
          <Text style={styles.groupName}>{course?.name}</Text>
        </View>
      </View>
      
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Avatar.Text size={40} label={item.studentName.charAt(0).toUpperCase()} style={styles.avatar} />
            <View style={styles.itemTextContainer}>
              <Text style={styles.studentName}>{item.studentName}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp.seconds * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
            <Text style={styles.sectionHeaderCount}>{data.length} Asistencias</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay registros de asistencia para este curso todavía.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginHorizontal: 20 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingBottom: 20, paddingTop: 10, paddingHorizontal: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  backButton: { position: 'absolute', top: 5, left: 5, zIndex: 1, },
  headerTitleContainer: { flex: 1, alignItems: 'center', },
  courseTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', },
  groupName: { fontSize: 16, color: '#777', marginTop: 4, },
  sectionHeader: {
    backgroundColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  sectionHeaderCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
  },
});