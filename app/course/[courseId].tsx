// app/course/[courseId].tsx
import ActionConfirmationModal from '@/components/ActionConfirmationModal';
import AddStudentModal from '@/components/AddStudentModal';
import ConfirmationModal, { ConfirmationStatus } from '@/components/ConfirmationModal';
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Divider, IconButton, Modal, Portal, Text, Title, useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import ViewShot from 'react-native-view-shot';

interface Student { id: string; name: string; }
interface Course { id: string; name: string; groupName: string; }

const ActionButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <Avatar.Icon size={56} icon={icon} style={styles.actionIcon} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
);

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const [shareQRModalVisible, setShareQRModalVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const [confirmationState, setConfirmationState] = useState<{
    visible: boolean;
    status: ConfirmationStatus;
    message: string;
  }>({ visible: false, status: 'loading', message: '' });
  
  const handleOpenStudentActions = (student: Student) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStudent(student);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    setStudentToEdit(selectedStudent);
    setAddEditModalVisible(true);
  };
  
  const handleAddNew = () => {
    setStudentToEdit(null);
    setAddEditModalVisible(true);
  };

  const handleDeletePress = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    setDeleteModalVisible(false);
    setConfirmationState({ visible: true, status: 'loading', message: 'Eliminando estudiante...' });
    try {
      await deleteDoc(doc(db, "students", selectedStudent.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmationState({ visible: true, status: 'success', message: '¡Eliminado!' });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Error al eliminar:", error);
      setConfirmationState({ visible: true, status: 'error', message: 'Error al eliminar' });
    } finally {
      setSelectedStudent(null);
    }
  };
  
  const handleShare = () => {
    setActionModalVisible(false);
    setShareQRModalVisible(true);
  };
  
  const onShareStudentQR = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Código QR de ${selectedStudent?.name}` });
    } catch (error) {
      console.error("Error al compartir:", error);
      Alert.alert("Error", "No se pudo compartir la tarjeta de identificación.");
    }
  };

  useEffect(() => {
    if (!courseId) return;
    const courseRef = doc(db, 'courses', courseId);
    const unsubscribeCourse = onSnapshot(courseRef, (doc) => { if (doc.exists()) setCourse({ id: doc.id, ...doc.data() } as Course); });
    const studentsQuery = query(collection(db, 'students'), where('courseId', '==', courseId), orderBy('name'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setLoading(false);
    }, () => setLoading(false));
    return () => { unsubscribeCourse(); unsubscribeStudents(); };
  }, [courseId]);

  const renderStudent = ({ item }: { item: Student }) => (
    <Pressable onPress={() => handleOpenStudentActions(item)}>
      <Card style={styles.studentCard}>
        <Card.Title
          title={item.name}
          titleStyle={styles.studentName}
          left={(props) => <Avatar.Text {...props} size={40} label={item.name.charAt(0).toUpperCase()} />}
        />
      </Card>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-group-outline" size={80} color="#c0c0c0" />
      <Title style={styles.emptyTitle}>No hay estudiantes todavía</Title>
      <Text style={styles.emptyText}>Usa el botón Añadir Alumno para empezar a construir tu lista.</Text>
    </View>
  );

  if (loading || !course) { return <View style={styles.centerScreen}><ActivityIndicator size="large" /></View>; }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor="#333" size={28} onPress={() => router.back()} style={styles.backButton} />
        <View style={styles.headerTitleContainer}>
          <Title style={styles.courseTitle}>{course.name}</Title>
          <Text style={styles.groupName}>{course.groupName}</Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <ActionButton icon="qrcode-scan" label="Escanear" onPress={() => router.push(`/scanner?courseId=${courseId}`)} />
        <ActionButton icon="history" label="Historial" onPress={() => router.push(`/attendanceHistory/${courseId}`)} />
        <ActionButton icon="account-plus" label="Añadir Alumno" onPress={handleAddNew} />
      </View>
      <Divider style={styles.divider} />
      <View style={styles.listHeaderContainer}>
        <Text style={styles.listHeader}>Estudiantes ({students.length})</Text>
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
      
      <AddStudentModal 
        visible={addEditModalVisible} 
        onDismiss={() => setAddEditModalVisible(false)} 
        courseId={courseId}
        studentToEdit={studentToEdit}
        onSaveSuccess={() => {}}
      />

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
              ¿Estás seguro? Se eliminará a <Text style={{ fontWeight: 'bold' }}>{selectedStudent?.name || ''}</Text> y no se puede deshacer.
            </>
          }
          confirmButtonText="Eliminar"
          confirmButtonColor="#dc3545"
          icon="alert-circle-outline"
          iconColor="#dc3545"
        />

        <Modal visible={actionModalVisible} onDismiss={() => setActionModalVisible(false)} contentContainerStyle={styles.actionModalContainer}>
          <Title style={styles.actionModalTitle}>{selectedStudent?.name}</Title>
          <Button icon="qrcode" mode="contained" onPress={handleShare} style={styles.actionModalButton}>Compartir QR</Button>
          <Button icon="pencil-outline" mode="contained" onPress={handleEdit} style={styles.actionModalButton}>Editar Nombre</Button>
          <Button icon="trash-can-outline" mode="contained" onPress={handleDeletePress} style={[styles.actionModalButton, {backgroundColor: theme.colors.error}]}>Eliminar Estudiante</Button>
        </Modal>
        
        {/* --- INICIO DE LA SECCIÓN DE QR MEJORADA --- */}
        <Modal visible={shareQRModalVisible} onDismiss={() => setShareQRModalVisible(false)} contentContainerStyle={styles.shareModalContainer}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: 'transparent' }}>
            <View style={styles.idCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>PASE DE ASISTENCIA</Text>
              </View>
              <View style={styles.cardBody}>
                <Avatar.Text size={hp('8%')} label={selectedStudent?.name.charAt(0).toUpperCase() || ''} style={styles.cardAvatar} />
                <Title style={styles.cardStudentName}>{selectedStudent?.name}</Title>
                <View style={styles.qrContainer}>
                  {selectedStudent && <QRCode value={selectedStudent.id} size={wp('55%')} />}
                </View>
                <Divider style={styles.cardDivider} />
                <View style={styles.cardFooter}>
                  <MaterialCommunityIcons name="school-outline" size={hp('2.5%')} color="#555" />
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseNameText}>{course.name}</Text>
                    <Text style={styles.groupNameText}>{course.groupName}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ViewShot>
          <Pressable style={styles.shareButton} onPress={onShareStudentQR}>
            <MaterialCommunityIcons name="share-variant" size={hp('3%')} color="#fff" />
            <Text style={styles.shareButtonText}>Compartir</Text>
          </Pressable>
        </Modal>
        {/* --- FIN DE LA SECCIÓN DE QR MEJORADA --- */}

      </Portal>

    </View>
  );
}

const styles = StyleSheet.create({
    centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' },
    container: { flex: 1, backgroundColor: '#f7f8fa' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingBottom: hp('2.5%'), paddingTop: hp('6%'), paddingHorizontal: wp('2.5%'), borderBottomLeftRadius: wp('8%'), borderBottomRightRadius: wp('8%'), elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
    backButton: { position: 'absolute', top: hp('5.5%'), left: wp('1%'), zIndex: 1 },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    courseTitle: { fontSize: hp('3%'), fontWeight: 'bold', color: '#333' },
    groupName: { fontSize: hp('2%'), color: '#777', marginTop: hp('0.5%') },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: hp('2.5%'), },
    actionButton: { alignItems: 'center', },
    actionIcon: { backgroundColor: '#185a9d', },
    actionLabel: { marginTop: hp('1%'), fontSize: hp('1.8%'), fontWeight: '500', color: '#333', },
    divider: { marginHorizontal: wp('5%'), marginBottom: hp('1.5%') },
    listHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp('5%'), marginBottom: hp('1.5%'), },
    listHeader: { fontSize: hp('2.5%'), fontWeight: 'bold', color: '#444', },
    listContent: { paddingBottom: hp('10%'), },
    studentCard: { marginHorizontal: wp('4%'), marginBottom: hp('1.5%'), backgroundColor: '#fff', borderRadius: wp('3%'), },
    studentName: { fontWeight: 'bold', fontSize: hp('2%') },
    emptyContainer: { alignItems: 'center', padding: wp('7%'), marginTop: hp('5%'), },
    emptyTitle: { marginTop: hp('2.5%'), fontSize: hp('2.8%'), color: '#555', },
    emptyText: { textAlign: 'center', marginTop: hp('1%'), fontSize: hp('2%'), color: '#888', },
    actionModalContainer: { backgroundColor: '#f7f8fa', paddingVertical: hp('4%'), paddingHorizontal: wp('5%'), margin: wp('5%'), borderRadius: wp('5%'), },
    actionModalTitle: { textAlign: 'center', marginBottom: hp('2.5%'), fontSize: hp('3%'), fontWeight: 'bold', },
    actionModalButton: { marginBottom: hp('1.5%'), paddingVertical: hp('0.6%'), borderRadius: wp('10%'), },

    // --- NUEVOS ESTILOS PARA TARJETA QR ---
    shareModalContainer: {
      padding: wp('5%'),
      backgroundColor: 'transparent',
    },
    idCard: {
      backgroundColor: '#f7f8fa',
      borderRadius: wp('6%'),
      overflow: 'hidden',
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 10 },
    },
    cardHeader: {
      backgroundColor: '#185a9d',
      paddingVertical: hp('2%'),
      alignItems: 'center',
    },
    cardHeaderText: {
      color: '#fff',
      fontSize: hp('2%'),
      fontWeight: 'bold',
      letterSpacing: 2,
    },
    cardBody: {
      padding: wp('5%'),
      alignItems: 'center',
    },
    cardAvatar: {
      marginBottom: hp('1.5%'),
    },
    cardStudentName: {
      fontSize: hp('3.5%'),
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#333',
    },
    qrContainer: {
      marginVertical: hp('2%'),
      padding: wp('3%'),
      backgroundColor: '#fff',
      borderRadius: wp('4%'),
    },
    cardDivider: {
      width: '100%',
      marginVertical: hp('2%'),
      backgroundColor: '#e0e0e0',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    courseInfo: {
      marginLeft: wp('3%'),
    },
    courseNameText: {
      fontSize: hp('2%'),
      fontWeight: 'bold',
      color: '#333',
    },
    groupNameText: {
      fontSize: hp('1.8%'),
      color: '#777',
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp('2.5%'),
      backgroundColor: '#185a9d',
      paddingVertical: hp('1.8%'),
      borderRadius: wp('8%'),
      elevation: 4,
    },
    shareButtonText: {
      color: '#fff',
      fontSize: hp('2.2%'),
      fontWeight: 'bold',
      marginLeft: wp('2.5%'),
    },
});