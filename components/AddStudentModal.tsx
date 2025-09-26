// components/AddStudentModal.tsx

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

interface AddStudentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (studentData: { fullName: string; studentId: string }) => void;
}

const AddStudentModal = ({ visible, onDismiss, onSave }: AddStudentModalProps) => {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSave = () => {
    // Validamos que los campos no estén vacíos
    if (fullName.trim() && studentId.trim()) {
      onSave({ fullName, studentId });
      // Limpiamos los campos para el próximo uso
      setFullName('');
      setStudentId('');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Text variant="headlineMedium" style={styles.title}>Añadir Estudiante</Text>
        <TextInput
          label="Nombre Completo del Estudiante"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="ID Único del Estudiante"
          value={studentId}
          onChangeText={setStudentId}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
        />
        <HelperText type="info">
          Este ID es el que se guardará en el código QR.
        </HelperText>
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
  input: { marginBottom: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { marginLeft: 10 },
});

export default AddStudentModal;