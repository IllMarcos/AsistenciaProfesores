// app/scanner.tsx
import { db } from '@/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScanStatus = 'success' | 'already_scanned' | 'not_in_course' | 'invalid_qr';

interface ScanResult {
  status: ScanStatus;
  studentName?: string;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [borderColor, setBorderColor] = useState('#fff');
  const [sound, setSound] = useState<Audio.Sound>();
  
  const params = useLocalSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  // Cargar el sonido cuando el componente se monta
  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
           require('../../assets/sounds/success.mp3')
        );
        setSound(sound);
      } catch (error) {
        console.log("No se pudo cargar el sonido, asegúrate que exista en assets/sounds/success.mp3", error);
      }
    }
    loadSound();

    // Descargar el sonido de la memoria cuando el componente se desmonta
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, []);
  
  async function playSound() {
    try {
        await sound?.replayAsync();
    } catch (e) {
        console.log(`Could not play sound: ${e}`)
    }
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const studentId = data;
      const studentRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists() || studentDoc.data().courseId !== courseId) {
        setBorderColor('#dc3545'); // Rojo
        setScanResult({ status: 'not_in_course' });
        return;
      }

      const studentName = studentDoc.data().name;
      const today = new Date().toISOString().split('T')[0];
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId), where('courseId', '==', courseId), where('date', '==', today)
      );
      const querySnapshot = await getDocs(attendanceQuery);

      if (querySnapshot.empty) {
        await addDoc(collection(db, 'attendance'), {
          studentId, studentName, courseId, date: today, timestamp: new Date(),
        });
        setBorderColor('#28a745'); // Verde
        setScanResult({ status: 'success', studentName });
        await playSound(); // Reproducir sonido de éxito
      } else {
        setBorderColor('#ffc107'); // Amarillo
        setScanResult({ status: 'already_scanned', studentName });
      }
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      setBorderColor('#dc3545'); // Rojo
      setScanResult({ status: 'invalid_qr' });
    } finally {
      // Auto-reseteo después de 2 segundos
      setTimeout(() => {
        setScanned(false);
        setScanResult(null);
        setBorderColor('#fff');
      }, 2000);
    }
  };

  useEffect(() => {
    if (!permission) {
        requestPermission();
    }
  }, [permission]);


  if (!permission) { return <View />; }
  if (!permission.granted) { 
      return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: 'center', fontSize: 18, color: '#333' }}>Necesitamos tu permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
   }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
        enableTorch={torchEnabled}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={28} iconColor="#fff" onPress={() => router.back()} />
          <Text style={styles.headerText}>Escanear Código QR</Text>
          <IconButton icon={torchEnabled ? "flash-off" : "flash"} size={28} iconColor="#fff" onPress={() => setTorchEnabled(!torchEnabled)} />
        </View>

        <View style={styles.scanContainer}>
            {!scanResult && (
              <>
                <View style={[styles.scanBox, { borderColor }]} />
                <Text style={styles.scanHelpText}>Apunta la cámara al código del estudiante</Text>
              </>
            )}
        </View>
        
        {scanResult && (
          <View style={styles.resultContainer}>
            {scanResult.status === 'success' && <>
              <MaterialCommunityIcons name="check-circle" size={60} color="#28a745" />
              <Text style={styles.resultTitle}>¡Asistencia Registrada!</Text>
              <Text style={styles.resultSubtitle}>{scanResult.studentName}</Text>
            </>}
            {scanResult.status === 'already_scanned' && <>
              <MaterialCommunityIcons name="alert-circle" size={60} color="#ffc107" />
              <Text style={styles.resultTitle}>Ya Registrado</Text>
              <Text style={styles.resultSubtitle}>{scanResult.studentName} ya tiene asistencia hoy.</Text>
            </>}
            {scanResult.status === 'not_in_course' && <>
              <MaterialCommunityIcons name="account-cancel" size={60} color="#dc3545" />
              <Text style={styles.resultTitle}>Error de Curso</Text>
              <Text style={styles.resultSubtitle}>Este estudiante no pertenece a este curso.</Text>
            </>}
             {scanResult.status === 'invalid_qr' && <>
              <MaterialCommunityIcons name="close-circle" size={60} color="#dc3545" />
              <Text style={styles.resultTitle}>QR No Válido</Text>
              <Text style={styles.resultSubtitle}>No se pudo leer el código correctamente.</Text>
            </>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  overlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.5)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  scanBox: { width: 250, height: 250, borderWidth: 4, borderRadius: 20, borderColor: '#fff', backgroundColor: 'transparent', },
  scanHelpText: { color: '#fff', fontSize: 16, marginTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 25,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 10, },
  resultSubtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginVertical: 5, },
});