// components/ActionConfirmationModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface ActionConfirmationModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode; // Acepta texto o componentes para mensajes más ricos
  confirmButtonText: string;
  confirmButtonColor: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
}

const ActionConfirmationModal = ({
  visible,
  onDismiss,
  onConfirm,
  title,
  message,
  confirmButtonText,
  confirmButtonColor,
  icon,
  iconColor
}: ActionConfirmationModalProps) => {
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
    } else {
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalBackdrop}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <View style={styles.header}>
            <MaterialCommunityIcons name={icon} size={hp('4%')} color={iconColor} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>
            {message}
          </Text>
          <View style={styles.buttonContainer}>
            <Button onPress={onDismiss} style={styles.button} labelStyle={styles.cancelButtonText}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={onConfirm} style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}>
              {confirmButtonText}
            </Button>
          </View>
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
    padding: wp('6%'),
    width: wp('90%'),
    borderRadius: wp('5%'),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: wp('2.5%'),
    fontSize: hp('2.8%')
  },
  message: {
    fontSize: hp('2%'),
    textAlign: 'center',
    color: '#555',
    lineHeight: hp('3%'),
    marginBottom: hp('3%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp('2%')
  },
  button: {
    marginLeft: wp('2%')
  },
  cancelButtonText: {
    color: '#777',
    fontWeight: 'bold'
  },
  confirmButton: {
    paddingHorizontal: wp('2.5%'),
    marginLeft: wp('2%'),
  },
});

export default ActionConfirmationModal;