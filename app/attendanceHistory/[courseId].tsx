// app/attendanceHistory/[courseId].tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, QueryDocumentSnapshot, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Avatar, Card, Divider, IconButton, Text, Title } from 'react-native-paper';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { addMonths, eachDayOfInterval, endOfMonth, format, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cacheDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { utils, write } from 'xlsx';

interface Student { id: string; name: string; }
interface AttendanceRecord { id: string; studentId: string; studentName: string; timestamp: { seconds: number; }; status: 'presente' | 'ausente'; }
interface Course { name: string; groupName: string; teacherName: string; }

interface DaySection {
  title: string;
  data: AttendanceRecord[];
}

// Componente para las tarjetas de estadísticas
const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) => (
    <View style={styles.statCard}>
        <MaterialCommunityIcons name={icon} size={32} color="#185a9d" />
        <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    </View>
);

export default function AttendanceHistoryScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
      setAllAttendance(attendanceList);
      setLoading(false);
    }, (error) => {
      console.error("ERROR: Firestore query failed.", error);
      setLoading(false);
    });

    return () => unsubscribeAttendance();
  }, [courseId]);

  const handleExport = async () => {
    if (students.length === 0) {
      Alert.alert("No hay estudiantes", "Añada estudiantes al curso para poder exportar.");
      return;
    }
    setExporting(true);
    const year = getYear(selectedDate);
    const month = getMonth(selectedDate);
    const monthName = format(selectedDate, 'MMMM', { locale: es }).toUpperCase();
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });

    const monthlyAttendance = allAttendance.filter(record => {
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
    const uri = cacheDirectory + `${course?.name}_${monthName}.xlsx`;

    try {
      await writeAsStringAsync(uri, wbout, { encoding: EncodingType.Base64 });
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

  const { dailySections, totalAttendances } = useMemo(() => {
    const filtered = allAttendance.filter(record => {
        const recordDate = new Date(record.timestamp.seconds * 1000);
        return getYear(recordDate) === getYear(selectedDate) && getMonth(recordDate) === getMonth(selectedDate);
    });

    const present = filtered.filter(record => record.status === 'presente');
    const grouped: { [key: string]: AttendanceRecord[] } = present.reduce((acc, record) => {
      const date = new Date(record.timestamp.seconds * 1000);
      const dateString = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[dateString]) acc[dateString] = [];
      acc[dateString].push(record);
      return acc;
    }, {} as { [key: string]: AttendanceRecord[] });

    const sections = Object.keys(grouped).map(date => ({ title: date, data: grouped[date] }));
    
    if (sections.length > 0 && !sections.find(sec => sec.title === expandedCard)) {
        setExpandedCard(sections[0].title);
    } else if (sections.length === 0) {
        setExpandedCard(null);
    }
    
    return {
      dailySections: sections,
      totalAttendances: present.length,
    };
  }, [allAttendance, selectedDate]);

  const toggleCard = (title: string) => {
    setExpandedCard(current => (current === title ? null : title));
  };

  if (loading) {
    return <View style={styles.centerScreen}><ActivityIndicator animating={true} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor="#333" size={28} onPress={() => router.back()} />
        <View style={styles.headerTitleContainer}>
          <Title style={styles.courseTitle}>Historial</Title>
          <Text style={styles.groupName}>{course?.name}</Text>
        </View>
        <IconButton icon="export-variant" iconColor="#185a9d" size={28} onPress={handleExport} disabled={exporting || students.length === 0} />
      </View>
      
      <View style={styles.monthSelectorContainer}>
        <IconButton icon="chevron-left" onPress={() => setSelectedDate(subMonths(selectedDate, 1))} />
        <Text style={styles.monthText}>{format(selectedDate, 'MMMM yyyy', { locale: es })}</Text>
        <IconButton icon="chevron-right" onPress={() => setSelectedDate(addMonths(selectedDate, 1))} />
      </View>

      {exporting && <ActivityIndicator animating={true} style={{ marginVertical: 10 }} />}
      
      <FlatList
        data={dailySections}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={
          <View style={styles.statsContainer}>
            <StatCard title="Total Asistencias del Mes" value={totalAttendances} icon="account-check" />
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedCard === item.title;
          return (
            <Card style={styles.dayCard}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleCard(item.title)}>
                <Card.Title
                  title={item.title}
                  titleStyle={styles.cardTitle}
                  subtitle={`${item.data.length} Asistencias`}
                  right={(props) => <IconButton {...props} icon={isExpanded ? 'chevron-up' : 'chevron-down'} />}
                />
              </TouchableOpacity>
              {isExpanded && (
                <Card.Content>
                  <Divider style={{ marginVertical: 10 }} />
                  {item.data.map((record) => (
                    <View key={record.id} style={styles.itemContainer}>
                      <Avatar.Text size={40} label={record.studentName.charAt(0).toUpperCase()} style={styles.avatar} />
                      <View style={styles.itemTextContainer}>
                        <Text style={styles.studentName}>{record.studentName}</Text>
                        <Text style={styles.timestamp}>{new Date(record.timestamp.seconds * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </View>
                  ))}
                </Card.Content>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay registros de asistencia para el mes seleccionado.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  header: {
    paddingTop: hp('6%'),
    paddingHorizontal: wp('2.5%'),
    paddingBottom: hp('2.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomLeftRadius: wp('8%'),
    borderBottomRightRadius: wp('8%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: wp('7%'),
  },
  courseTitle: { fontSize: hp('3%'), fontWeight: 'bold', color: '#333' },
  groupName: { fontSize: hp('2%'), color: '#777', marginTop: hp('0.5%') },
  monthSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  monthText: { fontSize: hp('2.2%'), fontWeight: 'bold', textTransform: 'capitalize', color: '#185a9d' },
  statsContainer: {
    marginBottom: hp('2%'),
    paddingHorizontal: wp('2%'),
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    alignItems: 'center',
    elevation: 3,
    flexDirection: 'row',
  },
  statTextContainer: {
    marginLeft: wp('4%'),
  },
  statValue: {
    fontSize: hp('2.8%'),
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: hp('1.8%'),
    color: '#666',
  },
  listContent: {
      paddingHorizontal: wp('4%'),
      paddingTop: hp('2%'),
  },
  dayCard: {
      marginBottom: hp('1.5%'),
      elevation: 2,
      backgroundColor: '#fff',
      borderRadius: wp('3%'),
  },
  cardTitle: {
      fontSize: hp('2.2%'),
      fontWeight: 'bold',
  },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp('1%') },
  avatar: { marginRight: wp('4%') },
  itemTextContainer: { flex: 1 },
  studentName: { fontSize: hp('2%'), fontWeight: '500', color: '#333' },
  timestamp: { fontSize: hp('1.8%'), color: '#888' },
  emptyContainer: { flex: 1, padding: wp('5%'), marginTop: hp('5%'), alignItems: 'center' },
  emptyText: { fontSize: hp('2.2%'), color: '#6c757d', textAlign: 'center' },
});