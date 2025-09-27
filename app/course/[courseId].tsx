// app/course/[courseId].tsx
import AddStudentModal, { NotificationType } from '@/components/AddStudentModal';
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Dialog, Divider, IconButton, Modal, Paragraph, Portal, Snackbar, Text, Title, useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
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
  
  // Modal para añadir/editar
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Nuevo modal para las acciones del estudiante
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Diálogo para confirmar eliminación
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  // Modal para compartir QR
  const [shareQRModalVisible, setShareQRModalVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // Notificaciones
  const [notification, setNotification] = useState<{ visible: boolean; message: string; type: NotificationType | null }>({ visible: false, message: '', type: null });
  
  const showNotification = ({ message, type }: { message: string; type: NotificationType }) => {
    setNotification({ visible: true, message, type });
  };
  
  // --- Lógica de Acciones ---
  const handleOpenStudentActions = (student: Student) => {
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
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    try {
      await deleteDoc(doc(db, "students", selectedStudent.id));
      showNotification({ message: `Estudiante "${selectedStudent.name}" eliminado`, type: 'delete' });
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setDeleteDialogVisible(false);
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
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Código QR para ${selectedStudent?.name}` });
    } catch (error) {
      console.error("Error al compartir:", error);
      Alert.alert("Error", "No se pudo compartir la tarjeta.");
    }
  };

  useEffect(() => {
    if (!courseId) return;
    const courseRef = doc(db, 'courses', courseId);
    const unsubscribeCourse = onSnapshot(courseRef, (doc) => { if (doc.exists()) setCourse({ id: doc.id, ...doc.data() } as Course); });
    const studentsQuery = query(collection(db, 'students'), where('courseId', '==', courseId));
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
      <Text style={styles.emptyText}>Usa el botón "Añadir Alumno" para empezar a construir tu lista.</Text>
    </View>
  );

  if (loading || !course) { return <View style={styles.centerScreen}><ActivityIndicator size="large" /></View>; }

    const snackbarStyles = {
    success: { backgroundColor: '#28a745' }, // Verde
    update: { backgroundColor: '#007bff' }, // Azul
    delete: { backgroundColor: '#dc3545' }, // Rojo
  };
  const snackbarIcon: Record<NotificationType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    success: 'check-circle-outline',
    update: 'information-outline',
    delete: 'alert-circle-outline',
  };

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
        onSaveSuccess={showNotification}
      />

      <Portal>
        <Modal visible={actionModalVisible} onDismiss={() => setActionModalVisible(false)} contentContainerStyle={styles.actionModalContainer}>
          <Title style={styles.actionModalTitle}>{selectedStudent?.name}</Title>
          <Button icon="qrcode" mode="contained" onPress={handleShare} style={styles.actionModalButton}>Compartir QR</Button>
          <Button icon="pencil-outline" mode="contained" onPress={handleEdit} style={styles.actionModalButton}>Editar Nombre</Button>
          <Button icon="trash-can-outline" mode="contained" onPress={handleDeletePress} style={[styles.actionModalButton, {backgroundColor: theme.colors.error}]}>Eliminar Estudiante</Button>
        </Modal>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Confirmar Eliminación</Dialog.Title>
          <Dialog.Content>
            <Paragraph>¿Estás seguro? Esta acción eliminará a <Text style={{fontWeight: 'bold'}}>{selectedStudent?.name}</Text> y no se puede deshacer.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Modal visible={shareQRModalVisible} onDismiss={() => setShareQRModalVisible(false)} contentContainerStyle={styles.shareModalContainer}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={{ backgroundColor: '#fff' }}>
            <View style={styles.shareCard}>
              <Text style={styles.shareCourseName}>{course.name}</Text>
              <Avatar.Text size={64} label={selectedStudent?.name.charAt(0).toUpperCase() || ''} style={{ marginVertical: 15 }} />
              <Title style={styles.shareStudentName}>{selectedStudent?.name}</Title>
              {selectedStudent && <QRCode value={selectedStudent.id} size={220} />}
            </View>
          </ViewShot>
          <Pressable style={styles.shareButton} onPress={onShareStudentQR}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Compartir ahora</Text>
          </Pressable>
        </Modal>
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
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingBottom: 20, paddingTop: 50, paddingHorizontal: 10, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
    backButton: { position: 'absolute', top: 45, left: 5, zIndex: 1, },
    headerTitleContainer: { flex: 1, alignItems: 'center', },
    courseTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', },
    groupName: { fontSize: 16, color: '#777', marginTop: 4, },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, },
    actionButton: { alignItems: 'center', },
    actionIcon: { backgroundColor: '#185a9d', },
    actionLabel: { marginTop: 8, fontSize: 14, fontWeight: '500', color: '#333', },
    divider: { marginHorizontal: 20, marginBottom: 10, },
    listHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, },
    listHeader: { fontSize: 20, fontWeight: 'bold', color: '#444', },
    listContent: { paddingBottom: 80, },
    studentCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', },
    studentName: { fontWeight: 'bold', },
    emptyContainer: { alignItems: 'center', padding: 30, marginTop: 40, },
    emptyTitle: { marginTop: 20, fontSize: 22, color: '#555', },
    emptyText: { textAlign: 'center', marginTop: 8, fontSize: 16, color: '#888', },
    shareModalContainer: { padding: 20, },
    shareCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', },
    shareCourseName: { fontSize: 18, color: '#666', },
    shareStudentName: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, },
    shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 30, elevation: 2, },
    shareButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10, },
    dialogTitle: { fontWeight: 'bold', },
    actionModalContainer: {
      backgroundColor: '#f7f8fa',
      paddingVertical: 30,
      paddingHorizontal: 20,
      margin: 20,
      borderRadius: 20,
    },
    actionModalTitle: {
      textAlign: 'center',
      marginBottom: 20,
      fontSize: 24,
      fontWeight: 'bold',
    },
    actionModalButton: {
      marginBottom: 10,
      paddingVertical: 5,
      borderRadius: 50,
    },
    snackbar: {
      borderRadius: 10,
      margin: 10,
    },
    snackbarContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    snackbarText: {
      color: '#fff',
      fontWeight: 'bold',
    },
});