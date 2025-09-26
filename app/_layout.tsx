import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { auth } from '../firebaseConfig';

// El componente principal que maneja la lógica de enrutamiento
const RootLayoutNav = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Escucha los cambios en el estado de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });
    
    // Limpia el listener cuando el componente se desmonte para evitar fugas de memoria
    return () => unsubscribe();
  }, []);

  // useEffect que se encarga de las redirecciones
  useEffect(() => {
    // No hacer nada mientras se verifica el estado inicial de autenticación
    if (initializing) return;

    // Verificamos si el primer segmento de la ruta es 'login' o 'register'.
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (user && inAuthGroup) {
      // Si el usuario está logueado pero está en la pantalla de login/registro,
      // lo mandamos a la pantalla principal.
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      // Si el usuario NO está logueado y NO está en una pantalla de auth,
      // lo mandamos a la pantalla de login.
      router.replace('/login');
    }
  }, [user, segments, initializing]);

  // Mientras se verifica el estado de auth, no mostramos nada para evitar parpadeos
  if (initializing) {
    return null; 
  }

  // Define la estructura de navegación de la aplicación
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      {/* 👇 NUEVAS PANTALLAS DE HISTORIAL REGISTRADAS 👇 */}
      <Stack.Screen name="attendanceHistory/[courseId]" options={{ headerShown: false }} />
      <Stack.Screen name="attendanceDetail/[recordId]" options={{ headerShown: false }} />
    </Stack>
  );
};

// El componente que se exporta y envuelve toda la app con el PaperProvider
export default function RootLayout() {
  return (
    <PaperProvider>
      <RootLayoutNav />
    </PaperProvider>
  );
}