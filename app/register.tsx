import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from '../src/components/ui/TextField';
import CustomButton from '../src/components/CustomButton';
import { registerUser, loginUser } from '../src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing } from '../src/theme';
import { isValidEmail } from '../src/utils/validation';
import { notify, messageFromError } from '../src/services/feedback';
import { saveLastLoginEmail } from '../src/services/lastLoginEmail';

const RegisterScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    const next: Record<string, string> = {};
    if (!username.trim()) next.username = 'El nombre de usuario es obligatorio';
    if (!email.trim()) next.email = 'El correo es obligatorio';
    else if (!isValidEmail(email)) next.email = 'Correo inválido';
    if (!password) next.password = 'La contraseña es obligatoria';
    else if (password.length < 6) next.password = 'Mínimo 6 caracteres';
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsLoading(true);
    try {
      const response = await registerUser({ username, email, password });
      if (!response.success) {
        notify.error('No se pudo registrar', { text2: response.message });
        return;
      }

      const loginResponse = await loginUser(email, password);
      if (!loginResponse?.user || !loginResponse.token) {
        notify.error('Cuenta creada, pero no pudimos iniciar sesión');
        router.replace('/login');
        return;
      }

      await login(
        {
          id: loginResponse.user.id,
          username: loginResponse.user.username,
          email: loginResponse.user.email,
          created_at: loginResponse.user.created_at || new Date().toISOString(),
        },
        loginResponse.token
      );
      await saveLastLoginEmail(email);
      notify.success('¡Bienvenido!', { text2: 'Vamos a configurar tu perfil.' });
      router.replace('/create-profile');
    } catch (error: unknown) {
      notify.error('Error de registro', { text2: messageFromError(error) });
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
              label="Nombre de usuario"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setErrors((e) => ({ ...e, username: '' }));
              }}
              autoCapitalize="none"
              error={errors.username}
            />
            <TextField
              label="Correo electrónico"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: '' }));
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
                setErrors((e) => ({ ...e, password: '' }));
              }}
              secureToggle
              secureTextEntry
              helper="Mínimo 6 caracteres"
              error={errors.password}
            />
            <CustomButton
              title="Crear cuenta"
              iconName="save-outline"
              iconPosition="right"
              iconSize={24}
              variant="primary"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.buttonPrimary}
            />
            <CustomButton
              title="¿Ya tienes cuenta? Inicia sesión"
              iconName="log-in-outline"
              iconPosition="right"
              iconSize={24}
              variant="outline"
              onPress={() => router.push('/login')}
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    width: '75%',
    maxWidth: 280,
    height: 120,
    marginBottom: spacing.xl,
    alignSelf: 'center',
  },
  buttonPrimary: { marginTop: spacing.md },
  buttonSecondary: { marginTop: spacing.sm },
});

export default RegisterScreen;
