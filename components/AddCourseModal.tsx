// components/AddCourseModal.tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';

interface AddCourseModalProps {
  visible: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}

const AddCourseModal = ({ visible, onClose, teacherId, teacherName }: AddCourseModalProps) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2024-2025');

  const handleSave = async () => {
    if (!name.trim() || !groupName.trim() || !schoolYear.trim()) {
      Alert.alert("Campos incompletos", "Por favor, rellena todos los campos.");
      return;
    }

    try {
      await addDoc(collection(db, 'courses'), {
        name: name.trim(),
        groupName: groupName.trim(),
        schoolYear: schoolYear.trim(),
        teacherId,
        teacherName,
      });
      setName('');
      setGroupName('');
      onClose();
    } catch (error) {
      console.error("Error al guardar el curso: ", error);
      Alert.alert("Error", "No se pudo guardar el curso. Inténtalo de nuevo.");
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
        <View style={styles.header}>
            <MaterialCommunityIcons name="school-outline" size={30} color="#185a9d" />
            <Text variant="headlineMedium" style={styles.title}>Nuevo Curso</Text>
        </View>
        
        <TextInput
          label="Nombre del Curso"
          placeholder="Ej. Programación Móvil"
          value={name}
          onChangeText={setName}
          mode="flat"
          style={styles.input}
          left={<TextInput.Icon icon="book-edit-outline" />}
        />
        <TextInput
          label="Grupo o Institución"
          placeholder="Ej. Misión Cultural No. 18"
          value={groupName}
          onChangeText={setGroupName}
          mode="flat"
          style={styles.input}
          left={<TextInput.Icon icon="account-group-outline" />}
        />
        <TextInput
          label="Ciclo Escolar"
          value={schoolYear}
          onChangeText={setSchoolYear}
          mode="flat"
          style={styles.input}
          left={<TextInput.Icon icon="calendar-range" />}
        />
        
        <View style={styles.buttonContainer}>
          <Button
            onPress={onClose}
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
            Guardar Curso
          </Button>
        </View>

      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#f7f8fa',
    padding: 25,
    margin: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 25,
  },
  cancelButton: {
    borderColor: '#ddd',
    borderWidth: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#777',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#185a9d',
    elevation: 2,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default AddCourseModal;