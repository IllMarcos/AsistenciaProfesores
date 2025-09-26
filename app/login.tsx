import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { auth } from '../firebaseConfig'; // Asegúrate de que la ruta sea correcta

// Importamos los componentes de React Native Paper
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';

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
      // El layout raíz se encargará de la redirección al detectar el cambio de estado de auth.
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
    <View style={styles.container}>
       <Text variant="headlineLarge" style={styles.title}>Bienvenido</Text>
       <Text variant="bodyMedium" style={styles.subtitle}>Inicia sesión para continuar</Text>

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
      
      {isLoading ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            labelStyle={{ paddingVertical: 5 }}
            disabled={isLoading}
          >
            Iniciar Sesión
          </Button>
          
          <Link href="/register" asChild>
            <Button
              style={styles.linkButton}
              disabled={isLoading}
            >
              ¿No tienes cuenta? Regístrate
            </Button>
          </Link>
        </>
      )}
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
});

export default LoginScreen;