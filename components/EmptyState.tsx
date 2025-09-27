// components/EmptyState.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Paragraph, Text } from 'react-native-paper';

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons name="folder-open-outline" size={80} color="#c0c0c0" />
    <Text style={styles.emptyTitle}>Todo listo para empezar</Text>
    <Paragraph style={styles.emptyText}>
      Parece que aún no has creado ningún curso. Toca el botón '+' para agregar el primero y empezar a gestionar la asistencia.
    </Paragraph>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: -80, // Ajuste para centrarlo mejor
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#555',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#777',
    lineHeight: 24,
  },
});

export default EmptyState;