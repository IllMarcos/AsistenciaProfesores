import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { auth } from '../firebaseConfig';
import { authStyles } from '../styles/uth-styles'; // Importamos los nuevos estilos

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos incompletos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let friendlyMessage = "Ocurrió un error al iniciar sesión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = "Correo o contraseña incorrectos.";
      }
      Alert.alert("Error de Inicio de Sesión", friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Bienvenido</Text>
      <Text style={authStyles.subtitle}>Inicia sesión para continuar</Text>

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
      
      {isLoading ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Button
            mode="contained"
            onPress={handleLogin}
            style={authStyles.button}
            labelStyle={{ paddingVertical: 5 }}
            disabled={isLoading}
          >
            Iniciar Sesión
          </Button>
          
          <Link href="/register" asChild>
            <Button
              style={authStyles.linkButton}
              disabled={isLoading}
            >
              <Text style={authStyles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </Button>
          </Link>
        </>
      )}
    </View>
  );
};

export default LoginScreen;