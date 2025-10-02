import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
// CORRECCIÓN: Se arregla la importación de React y useState
import React, { useState } from 'react';
// CORRECCIÓN: Se importa Pressable
import { Pressable, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { auth } from '../firebaseConfig';
import { authStyles } from '../styles/uth-styles';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      let friendlyMessage = "Ocurrió un error al iniciar sesión.";
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        friendlyMessage = "Correo o contraseña incorrectos.";
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      {/* CORRECCIÓN: El texto se pasa como hijo del componente Text */}
      <Text style={authStyles.title}>Bienvenido</Text>
      <Text style={authStyles.subtitle}>Inicia sesión para continuar</Text>

      <View style={authStyles.inputContainer}>
        <TextInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={authStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
        />
      </View>

      <View style={authStyles.inputContainer}>
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={authStyles.input}
          secureTextEntry={!passwordVisible}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon 
              icon={passwordVisible ? "eye-off" : "eye"} 
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
        />
      </View>
      
      {error ? (
        <View style={authStyles.errorContainer}>
          <Text style={authStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
      ) : (
        <>
          {/* CORRECCIÓN: El texto del botón se pasa como hijo */}
          <Button
            mode="contained"
            onPress={handleLogin}
            style={authStyles.button}
            labelStyle={authStyles.buttonLabel}
            disabled={isLoading}
          >
            Iniciar Sesión
          </Button>
          
          <Link href="/register" asChild>
            <Pressable style={authStyles.linkButtonContainer} disabled={isLoading}>
              <Text style={authStyles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
};

export default LoginScreen;