// app/register.tsx

import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { auth } from '../firebaseConfig';

// Importamos los componentes elegantes de React Native Paper
import { Button, Icon, Modal, Portal, Text, TextInput } from 'react-native-paper';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para controlar el modal y la carga
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const router = useRouter();

  const showModal = (message: string, error = false) => {
    setModalMessage(message);
    setIsError(error);
    setModalVisible(true);
  };

  const hideModal = () => setModalVisible(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showModal("Por favor, completa todos los campos.", true);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Creamos el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Actualizamos el perfil del usuario para guardar su nombre
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      
      setIsLoading(false);
      showModal("¡Registro exitoso! Serás redirigido.");

      // Esperamos un momento para que el usuario lea el mensaje y luego redirigimos
      setTimeout(() => {
        hideModal();
        // El layout raíz se encargará de la redirección automática
      }, 2000);

    } catch (error: any) {
      setIsLoading(false);
      // Mapeamos los errores de Firebase a mensajes más amigables
      let friendlyMessage = "Ocurrió un error inesperado.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "Este correo electrónico ya está registrado.";
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = "La contraseña debe tener al menos 6 caracteres.";
      }
      showModal(friendlyMessage, true);
    }
  };

  return (
    <View style={styles.container}>
      {/* El Portal permite que el Modal se muestre por encima de todo */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
          {isError ? 
            <Icon source="alert-circle-outline" color="#B00020" size={40} /> : 
            <Icon source="check-circle-outline" color="#00BFA5" size={40} />
          }
          <Text style={styles.modalText}>{modalMessage}</Text>
          {!isError && <Button onPress={() => hideModal()}>Cerrar</Button>}
        </Modal>
      </Portal>

      <Text variant="headlineLarge" style={styles.title}>Crear Cuenta</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Únete para empezar a gestionar la asistencia</Text>

      <TextInput
        label="Nombre Completo"
        value={name}
        onChangeText={setName}
        mode="outlined" // Este modo nos da el efecto de etiqueta flotante
        style={styles.input}
        left={<TextInput.Icon icon="account" />}
      />
      <TextInput
        label="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        left={<TextInput.Icon icon="email" />}
      />
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        left={<TextInput.Icon icon="lock" />}
      />

      <Button
        mode="contained" // Botón principal con fondo sólido
        onPress={handleSignUp}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        labelStyle={{ paddingVertical: 5 }}
      >
        {isLoading ? 'Registrando...' : 'Crear mi Cuenta'}
      </Button>
      
      <Button
        onPress={() => router.back()}
        style={styles.linkButton}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 30, color: 'gray' },
  input: { marginBottom: 15 },
  button: { marginTop: 20, borderRadius: 30 },
  linkButton: { marginTop: 15 },
  modalContainer: { backgroundColor: 'white', padding: 30, margin: 20, borderRadius: 10, alignItems: 'center' },
  modalText: { fontSize: 16, textAlign: 'center', marginVertical: 20 },
});

export default RegisterScreen;