// app/attendanceHistory/[courseId].tsx
import { db } from '@/firebaseConfig';
import { addMonths, eachDayOfInterval, endOfMonth, format, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, QueryDocumentSnapshot, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Divider, IconButton, Text, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { utils, write } from 'xlsx';

interface Student { id: string; name: string; }
// Se añade la propiedad 'status'
interface AttendanceRecord { id: string; studentId: string; studentName: string; timestamp: { seconds: number; }; status: 'presente' | 'ausente'; }
interface Course { name: string; groupName: string; teacherName: string; }

export default function AttendanceHistoryScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!courseId) return;
    const courseRef = doc(db, 'courses', courseId);
    const studentsQuery = query(collection(db, 'students'), where('courseId', '==', courseId), orderBy('name'));
    
    Promise.all([getDoc(courseRef), getDocs(studentsQuery)]).then(([courseDoc, studentsSnapshot]) => {
      if (courseDoc.exists()) setCourse(courseDoc.data() as Course);
      const studentList = studentsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentList);
    });

    const attendanceQuery = query(collection(db, 'attendance'), where('courseId', '==', courseId), orderBy('timestamp', 'desc'));
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendance(attendanceList);
      setLoading(false);
    }, (error) => {
      console.error("ERROR: Firestore query failed.", error);
      setLoading(false);
    });
    return () => unsubscribeAttendance();
  }, [courseId]);

  const handleExport = async () => {
    if (students.length === 0) {
      Alert.alert("No hay estudiantes", "Añada estudiantes para poder exportar.");
      return;
    }
    setExporting(true);
    const year = getYear(selectedDate);
    const month = getMonth(selectedDate);
    const monthName = format(selectedDate, 'MMMM', { locale: es }).toUpperCase();
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });

    const monthlyAttendance = attendance.filter(record => {
      const recordDate = new Date(record.timestamp.seconds * 1000);
      return getYear(recordDate) === year && getMonth(recordDate) === month;
    });

    const header = ["No.", "Nombre Del Alumno", ...daysInMonth.map((day: Date) => format(day, 'dd'))];
    
    const data = students.map((student, index) => {
      const studentRow: (string | number)[] = [index + 1, student.name];
      daysInMonth.forEach((day: Date) => {
        const dayString = format(day, 'yyyy-MM-dd');
        const attendanceRecord = monthlyAttendance.find(record =>
          record.studentId === student.id &&
          format(new Date(record.timestamp.seconds * 1000), 'yyyy-MM-dd') === dayString
        );
        let mark = '';
        if (attendanceRecord) {
          mark = attendanceRecord.status === 'presente' ? '*' : '|';
        }
        studentRow.push(mark);
      });
      return studentRow;
    });

    const ws_data = [
      ["SUBSECRETARIA DE EDUCACIÓN BÁSICA"], ["DEPARTAMENTO DE EDUCACIÓN PARA ADULTOS"],
      ["SUPERVISIÓN DE MISIONES CULTURALES ZONA 08"], ["REGISTRO DE ASISTENCIA MENSUAL"], [],
      [`Misión Cultural #4`, null, null, `Localidad: Adolfo Ruiz Cortines`],
      [`Clave C.T: 25HMC0010J`, null, null, `Ciclo Escolar: 2024-2025`],
      [`Estado: Sinaloa`, null, null, `Especialidad: ${course?.name}`], [],
      [`GRUPO: ${course?.groupName}`], [`MES: ${monthName}`], header, ...data
    ];
    
    const ws = utils.aoa_to_sheet(ws_data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, `Asistencia ${monthName}`);
    const wbout = write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + `${course?.name}_${monthName}.xlsx`;

    try {
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar Asistencia', UTI: 'com.microsoft.excel.xlsx'
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear el archivo Excel.");
    } finally {
      setExporting(false);
    }
  };

  const sections = useMemo(() => {
    // Solo mostrar las asistencias 'presentes' en la vista de la app
    const presentAttendance = attendance.filter(record => record.status === 'presente');
    const grouped: { [key: string]: AttendanceRecord[] } = presentAttendance.reduce((acc, record) => {
      const date = new Date(record.timestamp.seconds * 1000);
      const dateString = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[dateString]) acc[dateString] = [];
      acc[dateString].push(record);
      return acc;
    }, {} as { [key: string]: AttendanceRecord[] });

    return Object.keys(grouped).map(date => ({ title: date, data: grouped[date] }));
  }, [attendance]);

  if (loading) {
    return <View style={styles.centerScreen}><ActivityIndicator animating={true} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor="#333" size={28} onPress={() => router.back()} />
        <View style={styles.headerTitleContainer}>
          <Title style={styles.courseTitle}>Historial</Title>
          <Text style={styles.groupName}>{course?.name}</Text>
        </View>
        <IconButton icon="export-variant" iconColor="#185a9d" size={28} onPress={handleExport} disabled={exporting} />
      </View>
      
      <View style={styles.monthSelectorContainer}>
        <IconButton icon="chevron-left" onPress={() => setSelectedDate(subMonths(selectedDate, 1))} />
        <Text style={styles.monthText}>{format(selectedDate, 'MMMM yyyy', { locale: es })}</Text>
        <IconButton icon="chevron-right" onPress={() => setSelectedDate(addMonths(selectedDate, 1))} />
      </View>

      {exporting && <ActivityIndicator animating={true} style={{ marginVertical: 10 }} />}
      
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Avatar.Text size={40} label={item.studentName.charAt(0).toUpperCase()} style={styles.avatar} />
            <View style={styles.itemTextContainer}>
              <Text style={styles.studentName}>{item.studentName}</Text>
              <Text style={styles.timestamp}>{new Date(item.timestamp.seconds * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
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
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>No hay registros de asistencia.</Text></View>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginHorizontal: 20 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 10, elevation: 4, },
  headerTitleContainer: { flex: 1, alignItems: 'center', marginLeft: -30 },
  courseTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  groupName: { fontSize: 16, color: '#777', marginTop: 4 },
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
  monthText: { fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize', },
  sectionHeader: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#495057' },
  sectionHeaderCount: { fontSize: 14, color: '#6c757d' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  avatar: { marginRight: 15 },
  itemTextContainer: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: '500' },
  timestamp: { fontSize: 14, color: '#888' },
  emptyContainer: { flex: 1, padding: 20, marginTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#6c757d', textAlign: 'center' },
});