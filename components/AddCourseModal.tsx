// components/AddCourseModal.tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';

// Tipos que usaremos para las notificaciones
export type NotificationType = 'success' | 'update' | 'delete';

interface Course {
  id: string;
  name: string;
  groupName: string;
  schoolYear: string;
}

interface AddCourseModalProps {
  visible: boolean;
  onDismiss: () => void;
  teacherId: string;
  teacherName: string;
  // Prop opcional para el curso que se va a editar
  courseToEdit?: Course | null;
  // Prop para enviar notificaciones de vuelta
  onSaveSuccess: (notification: { message: string; type: NotificationType }) => void;
}

const AddCourseModal = ({ visible, onDismiss, teacherId, teacherName, courseToEdit, onSaveSuccess }: AddCourseModalProps) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2024-2025');

  const isEditing = !!courseToEdit;

  // Cargar datos del curso si estamos editando
  useEffect(() => {
    if (isEditing && courseToEdit) {
      setName(courseToEdit.name);
      setGroupName(courseToEdit.groupName);
      setSchoolYear(courseToEdit.schoolYear);
    } else {
      // Limpiar campos si es un curso nuevo
      setName('');
      setGroupName('');
      setSchoolYear('2024-2025');
    }
  }, [courseToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim() || !groupName.trim() || !schoolYear.trim()) {
      Alert.alert("Campos incompletos", "Por favor, completa todos los campos.");
      return;
    }

    try {
      if (isEditing && courseToEdit) {
        // Lógica para ACTUALIZAR
        const courseRef = doc(db, 'courses', courseToEdit.id);
        await updateDoc(courseRef, {
          name: name.trim(),
          groupName: groupName.trim(),
          schoolYear: schoolYear.trim(),
        });
        onSaveSuccess({ message: "Curso actualizado con éxito", type: 'update' });
      } else {
        // Lógica para AÑADIR
        await addDoc(collection(db, 'courses'), {
          name: name.trim(),
          groupName: groupName.trim(),
          schoolYear: schoolYear.trim(),
          teacherId,
          teacherName,
        });
        onSaveSuccess({ message: "Curso añadido con éxito", type: 'success' });
      }
      onDismiss();
    } catch (error) {
      console.error("Error al guardar el curso:", error);
      Alert.alert("Error", "No se pudo guardar la información del curso.");
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name={isEditing ? "pencil-outline" : "plus-circle-outline"} 
            size={30} color="#185a9d" 
          />
          <Text variant="headlineMedium" style={styles.title}>
            {isEditing ? 'Editar Curso' : 'Añadir Nuevo Curso'}
          </Text>
        </View>
        <TextInput
          label="Nombre del Curso (ej. Enfermería)"
          value={name}
          onChangeText={setName}
          mode="flat"
          style={styles.input}
        />
        <TextInput
          label="Nombre del Grupo (ej. Primaria G. Leyva)"
          value={groupName}
          onChangeText={setGroupName}
          mode="flat"
          style={styles.input}
        />
        <TextInput
          label="Ciclo Escolar"
          value={schoolYear}
          onChangeText={setSchoolYear}
          mode="flat"
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button onPress={onDismiss} style={styles.button} labelStyle={styles.cancelButtonText}>Cancelar</Button>
          <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { backgroundColor: '#f7f8fa', padding: 25, margin: 20, borderRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25, },
  title: { fontWeight: 'bold', color: '#333', marginLeft: 10, },
  input: { marginBottom: 15, backgroundColor: '#fff' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { marginLeft: 10 },
  cancelButtonText: { color: '#777', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#185a9d', paddingHorizontal: 10, },
});

export default AddCourseModal;