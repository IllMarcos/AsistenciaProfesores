import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getFunctions, httpsCallable } from 'firebase/functions';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Divider, List, Modal, Portal, Text } from 'react-native-paper';

interface Student {
  id: string;
  fullName: string;
  studentId: string;
}

interface AttendanceDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  recordDate: string;
  presentStudents: Student[];
  absentStudents: Student[];
  courseId: string;
}

const AttendanceDetailModal = ({ visible, onDismiss, recordDate, presentStudents, absentStudents, courseId }: AttendanceDetailModalProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const functions = getFunctions();
      const generateCsvReport = httpsCallable(functions, 'generateCsvReport');
      
      const month = recordDate.substring(0, 7); // Formato YYYY-MM
      const result = await generateCsvReport({ courseId, month });
      
      const csvString = (result.data as { csv: string }).csv;
      const filename = `Asistencia_${courseId}_${month}.csv`;
      const fileUri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
        setIsExporting(false);
        return;
      }
      
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar Asistencia' });

    } catch (error: any) {
      console.error("Error al exportar CSV:", error);
      Alert.alert("Error de Exportación", error.message || "No se pudo generar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <ScrollView>
          <Text variant="headlineSmall" style={styles.title}>Detalle de Asistencia</Text>
          <Text variant="titleMedium" style={styles.subtitle}>{new Date(recordDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</Text>
          
          <Button
            icon="file-excel"
            mode="contained"
            onPress={handleExport}
            loading={isExporting}
            disabled={isExporting}
            style={styles.exportButton}
          >
            {isExporting ? 'Generando Reporte...' : 'Exportar Reporte del Mes'}
          </Button>

          <Divider style={styles.divider} />
          <List.Subheader style={styles.subheaderGreen}>✅ Presentes ({presentStudents.length})</List.Subheader>
          {presentStudents.map(student => (
            <List.Item key={student.id} title={student.fullName} description={`ID: ${student.studentId}`} />
          ))}
          
          <Divider style={styles.divider} />
          <List.Subheader style={styles.subheaderRed}>❌ Ausentes ({absentStudents.length})</List.Subheader>
          {absentStudents.map(student => (
            <List.Item key={student.id} title={student.fullName} description={`ID: ${student.studentId}`} />
          ))}
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, maxHeight: '80%' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', color: 'gray', marginBottom: 20 },
  exportButton: { marginBottom: 20 },
  divider: { marginVertical: 10 },
  subheaderGreen: { fontWeight: 'bold', color: '#00BFA5' },
  subheaderRed: { fontWeight: 'bold', color: '#B00020' },
});

export default AttendanceDetailModal;