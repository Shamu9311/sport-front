import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from '../src/components/ui/TextField';
import CustomButton from '../src/components/CustomButton';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../src/theme';
import { useLoginWithProfileRedirect } from '../src/hooks/useLoginWithProfileRedirect';
import { isValidEmail } from '../src/utils/validation';
import { getLastLoginEmail, consumeSessionExpiredNotice } from '../src/services/lastLoginEmail';
import { saveLastLoginEmail } from '../src/services/lastLoginEmail';
import { notify } from '../src/services/feedback';

const LoginScreen = () => {
  const router = useRouter();
  const { submitLogin } = useLoginWithProfileRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    getLastLoginEmail().then((stored) => {
      if (stored) setEmail(stored);
    });
    consumeSessionExpiredNotice().then((pending) => {
      if (pending) {
        notify.warning('Tu sesión expiró', { text2: 'Inicia sesión de nuevo para continuar.' });
      }
    });
  }, []);

  const handleLogin = async () => {
    const nextErrors: typeof errors = {};
    if (!email || !password) {
      if (!email) nextErrors.email = 'El correo es obligatorio';
      if (!password) nextErrors.password = 'La contraseña es obligatoria';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Introduce un correo válido';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    try {
      await submitLogin({
        email,
        password,
        onMissingFields: () => setErrors({ email: 'Completa todos los campos' }),
        onInvalidEmail: () => setErrors({ email: 'Correo inválido' }),
        onIncompleteUser: () => notify.error('Datos de usuario incompletos'),
        onError: (message) => notify.error(message),
      });
      await saveLastLoginEmail(email);
    } finally {
      setIsLoading(false);
    }
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
            <TextField
              label="Correo electrónico"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureToggle
              secureTextEntry
              error={errors.password}
            />
            <CustomButton
              title="Iniciar sesión"
              iconName="log-in-outline"
              iconPosition="right"
              iconSize={24}
              variant="primary"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.buttonPrimary}
            />
            <CustomButton
              title="Crear cuenta"
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    width: '75%',
    maxWidth: 280,
    height: 120,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  buttonPrimary: { marginTop: spacing.md },
  buttonSecondary: { marginTop: spacing.sm },
});

export default LoginScreen;
