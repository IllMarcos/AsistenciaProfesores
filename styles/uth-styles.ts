import { StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: wp('8%'),
    backgroundColor: '#e0e5ec',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp('5%'),
  },
  logo: {
    width: wp('30%'),
    height: wp('30%'),
  },
  title: {
    fontSize: hp('4.5%'),
    fontWeight: '700', // Un peso de fuente más moderno
    textAlign: 'center',
    color: '#3d3d3d',
    marginBottom: hp('1%'),
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: hp('5%'),
    color: '#a0a5aa',
    fontSize: hp('2%'),
  },
  inputContainer: {
    marginBottom: hp('2%'),
  },
  input: {
    backgroundColor: '#e0e5ec',
    // Neumorfismo: Sombra exterior e interior para efecto de relieve
    shadowColor: '#ffffff',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 6,
    // La sombra oscura
    elevation: 10, // Para Android
  },
  helperText: {
    fontSize: hp('1.7%'),
  },
  button: {
    marginTop: hp('3%'),
    borderRadius: 30,
    paddingVertical: hp('1%'),
    backgroundColor: '#4a90e2',
    shadowColor: '#b0c4de',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonLabel: {
    fontWeight: 'bold',
  },
  linkButtonContainer: {
    marginTop: hp('3%'),
    alignItems: 'center',
  },
  linkText: {
    color: '#4a90e2',
    fontSize: hp('1.9%'),
  },
  errorContainer: {
    marginTop: hp('2%'),
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    padding: wp('3%'),
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});