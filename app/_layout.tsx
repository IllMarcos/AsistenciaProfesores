// illmarcos/asistenciaprofesores/AsistenciaProfesores-d17df92ff6c53e8d731d43a6512c663c222178b3/app/_layout.tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { auth } from '../firebaseConfig';

const theme = {
  ...MD3LightTheme, 
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4a90e2', 
    accent: '#4a90e2',   
  },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  // Ya no necesitamos 'loaded' o 'useFonts' aquí

  useEffect(() => {
    // Escondemos el Splash Screen después de un pequeño retraso para asegurar que todo cargue
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentRoute = segments.length > 0 ? segments[segments.length - 1] : '';
      const isAuthScreen = currentRoute === 'login' || currentRoute === 'register';

      if (user && isAuthScreen) {
        router.replace('/');
      } else if (!user && !isAuthScreen) {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [segments]);

  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}