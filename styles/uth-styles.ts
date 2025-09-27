// illmarcos/asistenciaprofesores/AsistenciaProfesores-d17df92ff6c53e8d731d43a6512c663c222178b3/styles/auth-styles.ts
import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#e0e5ec', // Un fondo claro y suave
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#3d3d3d',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#a0a5aa',
    fontSize: 16,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#e0e5ec',
    borderRadius: 15,
    borderTopStartRadius: 15,
    borderTopEndRadius: 15,
    elevation: 0, // Remove default Android shadow
    shadowOpacity: 0, // Remove default iOS shadow
  },
  button: {
    marginTop: 20,
    borderRadius: 30,
    paddingVertical: 8,
    backgroundColor: '#4a90e2', // Un azul vibrante
    shadowColor: '#b0c4de',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: '#4a90e2',
    textAlign: 'center',
  },
});