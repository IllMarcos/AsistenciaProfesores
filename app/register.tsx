import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { auth } from '../firebaseConfig';
import { authStyles } from '../styles/uth-styles';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', general: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();

  const validate = () => {
    const newErrors = { name: '', email: '', password: '', general: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio.';
      isValid = false;
    }
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El formato del correo no es válido.';
      isValid = false;
    }
    if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    setErrors({ name: '', email: '', password: '', general: '' });
    if (!validate()) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      // La navegación se maneja automáticamente por el _layout
    } catch (e: any) {
      let friendlyMessage = "Ocurrió un error al registrarse.";
      if (e.code === 'auth/email-already-in-use') {
        friendlyMessage = "Este correo electrónico ya está en uso.";
      }
      setErrors(prev => ({ ...prev, general: friendlyMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Crear Cuenta</Text>
      <Text style={authStyles.subtitle}>Regístrate para empezar a usar la app</Text>

      <View style={authStyles.inputContainer}>
        <TextInput
          label="Nombre Completo"
          value={name}
          onChangeText={(text) => { setName(text); if (errors.name) validate(); }}
          mode="outlined"
          style={authStyles.input}
          left={<TextInput.Icon icon="account" />}
          error={!!errors.name}
        />
        {errors.name && <HelperText type="error" visible={!!errors.name} style={authStyles.helperText}>{errors.name}</HelperText>}
      </View>

      <View style={authStyles.inputContainer}>
        <TextInput
          label="Correo Electrónico"
          value={email}
          onChangeText={(text) => { setEmail(text); if (errors.email) validate(); }}
          mode="outlined"
          style={authStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
          error={!!errors.email}
        />
        {errors.email && <HelperText type="error" visible={!!errors.email} style={authStyles.helperText}>{errors.email}</HelperText>}
      </View>

      <View style={authStyles.inputContainer}>
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={(text) => { setPassword(text); if (errors.password) validate(); }}
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
          error={!!errors.password}
        />
        {errors.password && <HelperText type="error" visible={!!errors.password} style={authStyles.helperText}>{errors.password}</HelperText>}
      </View>

      {errors.general ? (
        <View style={authStyles.errorContainer}>
          <Text style={authStyles.errorText}>{errors.general}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Button
            mode="contained"
            onPress={handleRegister}
            style={authStyles.button}
            labelStyle={authStyles.buttonLabel}
            disabled={isLoading}
          >
            Registrarse
          </Button>
          
          <Link href="/login" asChild>
            <Pressable style={authStyles.linkButtonContainer} disabled={isLoading}>
              <Text style={authStyles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
};

export default RegisterScreen;