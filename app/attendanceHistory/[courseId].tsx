// app/attendanceHistory/[courseId].tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Card, Text } from 'react-native-paper';
import AttendanceDetailModal from '../../components/AttendanceDetailModal';
import { db } from '../../firebaseConfig';

// Interfaces...
interface AttendanceRecord { id: string; date: string; presentStudentIds: string[]; }
interface Student { id: string; fullName: string; studentId: string; }
interface Course { studentIds: string[]; }

const AttendanceHistoryScreen = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [presentStudents, setPresentStudents] = useState<Student[]>([]);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    const q = query(collection(db, 'attendanceRecords'), where('courseId', '==', courseId), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(fetchedRecords);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [courseId]);

  const handleShowDetails = async (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsLoadingModal(true);
    setModalVisible(true);

    // 1. Obtener la lista completa de estudiantes del curso
    const courseRef = doc(db, 'courses', courseId!);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return;
    const allStudentIds = (courseSnap.data() as Course).studentIds;

    const studentPromises = allStudentIds.map(id => getDoc(doc(db, 'students', id)));
    const studentDocs = await Promise.all(studentPromises);
    const allStudents = studentDocs.map(snap => ({ id: snap.id, ...snap.data() } as Student));

    // 2. Separar en presentes y ausentes
    const present = allStudents.filter(s => record.presentStudentIds.includes(s.studentId));
    const absent = allStudents.filter(s => !record.presentStudentIds.includes(s.studentId));
    
    setPresentStudents(present);
    setAbsentStudents(absent);
    setIsLoadingModal(false);
  };

  if (isLoading) {
    return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Historial de Asistencia" />
      </Appbar.Header>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => handleShowDetails(item)}>
            <Card.Title
              title={new Date(item.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              subtitle={`${item.presentStudentIds.length} Estudiantes Presentes`}
              left={(props) => <Text {...props} style={{ fontSize: 24, marginLeft: 16 }}>📅</Text>}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay registros de asistencia.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />

      {selectedRecord && (
        <AttendanceDetailModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          recordDate={selectedRecord.date}
          presentStudents={presentStudents}
          absentStudents={absentStudents}
          courseId={courseId!}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, fontStyle: 'italic' },
});

export default AttendanceHistoryScreen;