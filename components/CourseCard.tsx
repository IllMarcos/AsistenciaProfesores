// components/CourseCard.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ColorValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Animated from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface Course {
  id: string;
  name: string;
  groupName: string;
  studentCount?: number;
}

interface CourseCardProps {
  course: Course;
  gradient: [ColorValue, ColorValue];
  // 1. Aceptará un estilo animado desde el componente padre
  animatedStyle: StyleProp<ViewStyle>;
}

// 2. La tarjeta ya no se envuelve en Pressable, solo muestra datos.
const CourseCard = ({ course, gradient, animatedStyle }: CourseCardProps) => {
  return (
    // 3. Aplicamos el estilo animado que nos llega desde las props
    <Animated.View style={[styles.shadowContainer, animatedStyle]}>
      <LinearGradient colors={gradient} style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="school" size={hp('3.5%')} color="rgba(255, 255, 255, 0.8)" />
        </View>
        <View>
          <Text style={styles.courseName}>{course.name}</Text>
          <Text style={styles.groupName}>{course.groupName}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.studentCount}>
            {course.studentCount || 0} Estudiantes
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Los estilos se mantienen exactamente igual
const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: wp('5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: hp('3%'),
  },
  card: {
    borderRadius: wp('5%'),
    padding: wp('5%'),
    overflow: 'hidden',
    minHeight: hp('22%'),
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: wp('4%'),
    padding: wp('2%'),
  },
  courseName: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  groupName: {
    fontSize: hp('2.2%'),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    marginTop: hp('1.5%'),
    alignItems: 'flex-end',
  },
  studentCount: {
    fontSize: hp('1.8%'),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});

export default CourseCard;