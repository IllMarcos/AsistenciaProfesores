// components/ConfirmationModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, Modal, Portal, Text } from 'react-native-paper';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

export type ConfirmationStatus = 'loading' | 'success' | 'error';

// CORRECCIÓN: Se añade la nueva propiedad a la interfaz
interface ConfirmationModalProps {
  visible: boolean;
  status: ConfirmationStatus;
  message: string;
  onDismiss: () => void;
  autoDismissDelay?: number; // Prop para la duración del mensaje
}

// Se establece un valor por defecto de 1800ms si no se proporciona la prop
const ConfirmationModal = ({ visible, status, message, onDismiss, autoDismissDelay = 1800 }: ConfirmationModalProps) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.exp) });
      opacity.value = withTiming(1, { duration: 200 });

      // Si el estado es de éxito o error, cerramos el modal automáticamente
      if (status === 'success' || status === 'error') {
        setTimeout(() => {
          onDismiss();
        }, autoDismissDelay); // Usamos la nueva prop para la duración
      }
    } else {
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
    // Se actualizan las dependencias del useEffect
  }, [visible, status, autoDismissDelay, onDismiss, scale, opacity]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <ActivityIndicator animating={true} color="#185a9d" size="large" />
            <Text style={styles.messageText}>{message}</Text>
          </>
        );
      case 'success':
        return (
          <>
            <MaterialCommunityIcons name="check-circle-outline" size={hp('8%')} color="#28a745" />
            <Text style={styles.messageText}>{message}</Text>
          </>
        );
      case 'error':
         return (
          <>
            <MaterialCommunityIcons name="alert-circle-outline" size={hp('8%')} color="#dc3545" />
            <Text style={styles.messageText}>{message}</Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalBackdrop}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          {renderContent()}
        </Animated.View>
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
    paddingVertical: hp('4%'),
    paddingHorizontal: wp('6%'),
    width: wp('80%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    marginTop: hp('2%'),
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

export default ConfirmationModal;