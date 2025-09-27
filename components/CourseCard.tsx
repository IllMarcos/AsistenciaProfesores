// components/CourseCard.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
// CORRECCIÓN: Se importa ColorValue para el tipado correcto
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ColorValue, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface Course {
  id: string;
  name: string;
  groupName: string;
  studentCount?: number; 
}

interface CourseCardProps {
  course: Course;
  // CORRECCIÓN: Se especifica un tipo más estricto para el array de colores
  gradient: [ColorValue, ColorValue]; 
}

const CourseCard = ({ course, gradient }: CourseCardProps) => {
  return (
    <View style={styles.shadowContainer}>
      <LinearGradient colors={gradient} style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="school" size={28} color="rgba(255, 255, 255, 0.8)" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 8,
  },
  courseName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  groupName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  studentCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});

export default CourseCard;