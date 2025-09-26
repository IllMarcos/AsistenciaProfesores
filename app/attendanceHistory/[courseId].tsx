// app/attendanceHistory/[courseId].tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Card, Text } from 'react-native-paper';
import { db } from '../../firebaseConfig';

interface AttendanceRecord {
  id: string;
  date: string;
  presentStudentIds: string[];
}

const AttendanceHistoryScreen = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const q = query(
      collection(db, 'attendanceRecords'),
      where('courseId', '==', courseId),
      orderBy('date', 'desc') // Ordenamos para mostrar las fechas más recientes primero
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));
      setRecords(fetchedRecords);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [courseId]);

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
          <Card 
            style={styles.card}
            // TODO: Habilitar la navegación al detalle de la fecha
            // onPress={() => router.push(`/attendanceDetail/${item.id}`)}
          >
            <Card.Title
              title={new Date(item.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              subtitle={`${item.presentStudentIds.length} Estudiantes Presentes`}
              left={(props) => <Text {...props} style={{fontSize: 24, marginLeft: 16}}>📅</Text>}
            />
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay registros de asistencia para este curso.</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />
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