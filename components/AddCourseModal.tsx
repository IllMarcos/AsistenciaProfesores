// components/AddCourseModal.tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

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
  courseToEdit?: Course | null;
  onSaveSuccess: (notification: { message: string; type: NotificationType }) => void;
}

const AddCourseModal = ({ visible, onDismiss, teacherId, teacherName, courseToEdit, onSaveSuccess }: AddCourseModalProps) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isEditing = !!courseToEdit;

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (visible) {
      if (isEditing && courseToEdit) {
        setName(courseToEdit.name);
        setGroupName(courseToEdit.groupName);
        setSchoolYear(courseToEdit.schoolYear);
      }
      scale.value = withSpring(1, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, courseToEdit]);

  const handleClose = () => {
    if (isSaving && !showSuccess) return;

    scale.value = withTiming(0.95, { duration: 200, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: 150 });
    
    setTimeout(() => {
      setName('');
      setGroupName('');
      setSchoolYear('2025-2026');
      setShowSuccess(false);
      setIsSaving(false);
      onDismiss();
    }, 200);
  };

  const handleSave = async () => {
    if (!name.trim() || !groupName.trim() || !schoolYear.trim()) {
      Alert.alert("Campos incompletos", "Por favor, completa todos los campos.");
      return;
    }

    setIsSaving(true);
    try {
      let message = "";
      let type: NotificationType = 'success';

      if (isEditing && courseToEdit) {
        const courseRef = doc(db, 'courses', courseToEdit.id);
        await updateDoc(courseRef, {
          name: name.trim(),
          groupName: groupName.trim(),
          schoolYear: schoolYear.trim(),
        });
        message = "Curso actualizado con éxito";
        type = 'update';
      } else {
        await addDoc(collection(db, 'courses'), {
          name: name.trim(),
          groupName: groupName.trim(),
          schoolYear: schoolYear.trim(),
          teacherId,
          teacherName,
          // Se inicializa el contador en 0 para que la Cloud Function lo pueda incrementar
          studentCount: 0,
        });
        message = "Curso añadido con éxito";
        type = 'success';
      }
      onSaveSuccess({ message, type });
      setShowSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (error) {
      console.error("Error al guardar el curso:", error);
      Alert.alert("Error", "No se pudo guardar la información del curso.");
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalBackdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
                    name={isEditing ? "pencil-outline" : "plus-circle-outline"} 
                    size={hp('3.5%')} color="#185a9d" 
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
                  disabled={isSaving}
                />
                <TextInput
                  label="Nombre del Grupo (ej. Primaria G. Leyva)"
                  value={groupName}
                  onChangeText={setGroupName}
                  mode="flat"
                  style={styles.input}
                  disabled={isSaving}
                />
                <TextInput
                  label="Ciclo Escolar"
                  value={schoolYear}
                  onChangeText={setSchoolYear}
                  mode="flat"
                  style={styles.input}
                  disabled={isSaving}
                />
                <View style={styles.buttonContainer}>
                  <Button onPress={handleClose} style={styles.button} labelStyle={styles.cancelButtonText} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button mode="contained" onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator animating={true} color="#fff" size="small" />
                    ) : (
                      isEditing ? 'Actualizar' : 'Guardar'
                    )}
                  </Button>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#fff'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp('2.5%')
  },
  button: {
    marginLeft: wp('2%')
  },
  cancelButtonText: {
    color: '#777',
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#185a9d',
    paddingHorizontal: wp('2.5%'),
    marginLeft: wp('2%'),
    justifyContent: 'center',
    minWidth: wp('25%'),
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

export default AddCourseModal;