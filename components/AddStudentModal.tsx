// components/AddStudentModal.tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

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
  // La prop onSaveSuccess se mantiene por consistencia, pero ya no la usaremos para mostrar notificaciones
  onSaveSuccess: (notification: { message: string; type: NotificationType }) => void;
}

const AddStudentModal = ({ visible, onDismiss, courseId, studentToEdit, onSaveSuccess }: AddStudentModalProps) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isEditing = !!studentToEdit;

  // Animaciones
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (visible) {
      if (isEditing && studentToEdit) {
        setName(studentToEdit.name);
      }
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.exp) });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [studentToEdit, visible]);

  const handleClose = () => {
    if (isSaving && !showSuccess) return;
    setTimeout(() => {
      setName('');
      setShowSuccess(false);
      setIsSaving(false);
    }, 200);
    onDismiss();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Campo incompleto", "Por favor, ingresa el nombre del estudiante.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && studentToEdit) {
        const studentRef = doc(db, 'students', studentToEdit.id);
        await updateDoc(studentRef, { name: name.trim() });
        onSaveSuccess({ message: "Estudiante actualizado con éxito", type: 'update' });
      } else {
        if (!courseId) {
          Alert.alert("Error", "No se ha proporcionado un ID de curso.");
          setIsSaving(false);
          return;
        }
        await addDoc(collection(db, 'students'), {
          name: name.trim(),
          courseId: courseId,
        });
        onSaveSuccess({ message: "Estudiante añadido con éxito", type: 'success' });
      }
      setShowSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No se pudo guardar la información.");
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalBackdrop}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          {showSuccess ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle-outline" size={hp('8%')} color="#28a745" />
              <Text variant="headlineSmall" style={styles.successText}>
                {isEditing ? '¡Actualizado!' : '¡Guardado!'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <MaterialCommunityIcons 
                  name={isEditing ? "account-edit-outline" : "account-plus-outline"} 
                  size={hp('3.5%')} color="#185a9d" 
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
                disabled={isSaving}
              />
              
              <View style={styles.buttonContainer}>
                <Button onPress={handleClose} mode="outlined" style={styles.cancelButton} labelStyle={styles.cancelButtonText} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onPress={handleSave} mode="contained" style={styles.saveButton} labelStyle={styles.saveButtonText} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator animating={true} color="#fff" size="small" /> : (isEditing ? 'Actualizar' : 'Guardar')}
                </Button>
              </View>
            </>
          )}
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#f7f8fa',
    padding: wp('6%'),
    width: wp('90%'),
    borderRadius: wp('5%'),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('3%'),
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: wp('2.5%'),
    fontSize: hp('2.5%')
  },
  input: {
    marginBottom: hp('2%'),
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: hp('2.5%'),
  },
  cancelButton: {
    borderColor: '#ddd',
    borderWidth: 1,
    marginRight: wp('2.5%'),
  },
  cancelButtonText: {
    color: '#777',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#185a9d',
    elevation: 2,
    justifyContent: 'center',
    minWidth: wp('25%'),
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: hp('1.9%'),
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('4%'),
  },
  successText: {
    marginTop: hp('2%'),
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AddStudentModal;