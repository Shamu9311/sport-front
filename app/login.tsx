import React, { useState } from 'react';
import {
  View,
  Image,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthForm from '../src/components/AuthForm';
import CustomButton from '../src/components/CustomButton';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../src/theme';
import { useLoginWithProfileRedirect } from '../src/hooks/useLoginWithProfileRedirect';

const LoginScreen = () => {
  const router = useRouter();
  const { submitLogin } = useLoginWithProfileRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    submitLogin({
      email,
      password,
      onMissingFields: () =>
        Alert.alert('Error', 'Por favor completa todos los campos'),
      onInvalidEmail: () =>
        Alert.alert('Error', 'Introduce un correo electrónico válido.'),
      onIncompleteUser: () => Alert.alert('Error', 'Datos de usuario incompletos'),
      onError: (message) => Alert.alert('Error de Inicio de Sesión', message),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <Image
              source={require('../assets/images/login.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <AuthForm
              fields={[
                {
                  label: 'Correo Electrónico',
                  value: email,
                  onChangeText: setEmail,
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                },
                {
                  label: 'Contraseña',
                  value: password,
                  onChangeText: setPassword,
                  secure: true,
                },
              ]}
            />
            <CustomButton
              title="INGRESAR"
              iconName="log-in-outline"
              iconPosition="right"
              iconSize={24}
              variant="primary"
              onPress={handleLogin}
              style={styles.buttonPrimary}
            />
            <CustomButton
              title="REGISTRARSE"
              iconName="person-add-outline"
              iconPosition="right"
              iconSize={24}
              variant="outline"
              onPress={() => router.push('/register')}
              style={styles.buttonSecondary}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    width: '80%',
    height: 160,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  buttonPrimary: {
    marginTop: spacing.md,
  },
  buttonSecondary: {
    marginTop: spacing.sm,
  },
});

export default LoginScreen;
