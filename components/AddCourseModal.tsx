// components/AddCourseModal.tsx

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';

interface AddCourseModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (courseData: { name: string; groupName: string; schoolYear: string }) => void;
}

const AddCourseModal = ({ visible, onDismiss, onSave }: AddCourseModalProps) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2024-2025'); // Valor por defecto

  const handleSave = () => {
    if (name.trim() && groupName.trim() && schoolYear.trim()) {
      onSave({ name, groupName, schoolYear });
      // Limpiamos los campos para la próxima vez
      setName('');
      setGroupName('');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Text variant="headlineMedium" style={styles.title}>Añadir Nuevo Curso</Text>
        <TextInput
          label="Nombre del Curso (ej. Enfermería)"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Nombre del Grupo (ej. Primaria G. Leyva)"
          value={groupName}
          onChangeText={setGroupName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Ciclo Escolar"
          value={schoolYear}
          onChangeText={setSchoolYear}
          mode="outlined"
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button onPress={onDismiss} style={styles.button}>Cancelar</Button>
          <Button mode="contained" onPress={handleSave} style={styles.button}>Guardar</Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10 },
  title: { marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 15 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { marginLeft: 10 },
});

export default AddCourseModal;