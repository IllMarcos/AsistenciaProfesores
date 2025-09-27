// components/AddStudentModal.tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';

interface Student {
  id: string;
  name: string;
}

export type NotificationType = 'success' | 'update' | 'delete';

interface AddStudentModalProps {
  visible: boolean;
  onDismiss: () => void;
  courseId?: string;
  studentToEdit?: Student | null;
  onSaveSuccess: (notification: { message: string; type: NotificationType }) => void;
}

const AddStudentModal = ({ visible, onDismiss, courseId, studentToEdit, onSaveSuccess }: AddStudentModalProps) => {
  const [name, setName] = useState('');
  const isEditing = !!studentToEdit;

  useEffect(() => {
    if (isEditing && studentToEdit) {
      setName(studentToEdit.name);
    } else {
      setName('');
    }
  }, [studentToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Campo incompleto", "Por favor, ingresa el nombre del estudiante.");
      return;
    }

    try {
      if (isEditing && studentToEdit) {
        const studentRef = doc(db, 'students', studentToEdit.id);
        await updateDoc(studentRef, { name: name.trim() });
        onSaveSuccess({ message: "Estudiante actualizado con éxito", type: 'update' });
      } else {
        if (!courseId) {
          Alert.alert("Error", "No se ha proporcionado un ID de curso.");
          return;
        }
        await addDoc(collection(db, 'students'), {
          name: name.trim(),
          courseId: courseId,
        });
        onSaveSuccess({ message: "Estudiante añadido con éxito", type: 'success' });
      }
      onDismiss();
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No se pudo guardar la información.");
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name={isEditing ? "account-edit-outline" : "account-plus-outline"} 
            size={30} color="#185a9d" 
          />
          <Text variant="headlineMedium" style={styles.title}>
            {isEditing ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </Text>
        </View>

        <TextInput
          label="Nombre Completo del Estudiante"
          value={name}
          onChangeText={setName}
          mode="flat"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />
        
        <View style={styles.buttonContainer}>
          <Button
            onPress={onDismiss}
            mode="outlined"
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSave}
            mode="contained"
            style={styles.saveButton}
            labelStyle={styles.saveButtonText}
          >
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { backgroundColor: '#f7f8fa', padding: 25, margin: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25, },
  title: { fontWeight: 'bold', color: '#333', marginLeft: 10, },
  input: { marginBottom: 15, backgroundColor: '#fff', borderBottomWidth: 0, },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 25, },
  cancelButton: { borderColor: '#ddd', borderWidth: 1, marginRight: 10, },
  cancelButtonText: { color: '#777', fontWeight: 'bold', },
  saveButton: { backgroundColor: '#185a9d', elevation: 2, },
  saveButtonText: { fontWeight: 'bold', fontSize: 15, },
});

export default AddStudentModal;