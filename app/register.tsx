// illmarcos/asistenciaprofesores/AsistenciaProfesores-d17df92ff6c53e8d731d43a6512c663c222178b3/app/register.tsx
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { auth } from '../firebaseConfig';
import { authStyles } from '../styles/uth-styles'; // Importamos los nuevos estilos

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }

    } catch (error: any) {
      let friendlyMessage = "Ocurrió un error inesperado.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "Este correo electrónico ya está registrado.";
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = "La contraseña debe tener al menos 6 caracteres.";
      }
      alert(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Crear Cuenta</Text>
      <Text style={authStyles.subtitle}>Únete para empezar a gestionar la asistencia</Text>

      <TextInput
        label="Nombre Completo"
        value={name}
        onChangeText={setName}
        mode="flat"
        style={authStyles.input}
        left={<TextInput.Icon icon="account" />}
        underlineColor="transparent"
      />
      <TextInput
        label="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        mode="flat"
        style={authStyles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        left={<TextInput.Icon icon="email" />}
        underlineColor="transparent"
      />
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        mode="flat"
        style={authStyles.input}
        secureTextEntry
        left={<TextInput.Icon icon="lock" />}
        underlineColor="transparent"
      />

      <Button
        mode="contained"
        onPress={handleSignUp}
        loading={isLoading}
        disabled={isLoading}
        style={authStyles.button}
        labelStyle={{ paddingVertical: 5 }}
      >
        {isLoading ? 'Registrando...' : 'Crear mi Cuenta'}
      </Button>
      
      <Button
        onPress={() => router.back()}
        style={authStyles.linkButton}
      >
        <Text style={authStyles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Button>
    </View>
  );
};

export default RegisterScreen;