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
import { loginUser } from '../src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing } from '../src/theme';

const LoginScreen = () => {
  const router = useRouter();
  const { login, checkUserProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      const response = await loginUser(email, password);

      if (response && response.user) {
        const userData = {
          id: response.user.id || 1,
          username: response.user.username || '',
          email: response.user.email || '',
          created_at: response.user.created_at || new Date().toISOString(),
        };

        await login(userData, response.token);

        try {
          const hasProfile = await checkUserProfile();

          if (hasProfile) {
            router.replace('/(tabs)');
          } else {
            router.replace('/create-profile');
          }
        } catch {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', 'Datos de usuario incompletos');
      }
    } catch (error: any) {
      console.error('Login failed:', error);

      const errorResponse = error.response;
      let errorMessage = 'Ocurrió un error inesperado durante el inicio de sesión.';

      if (errorResponse) {
        if (errorResponse.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos.';
        } else if (errorResponse.data?.message) {
          errorMessage = errorResponse.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        errorMessage = error.message || errorMessage;
      }

      Alert.alert('Error de Inicio de Sesión', errorMessage);
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  logo: {
    width: '70%',
    maxWidth: 280,
    height: 100,
    marginBottom: spacing.xxl,
  },
  buttonPrimary: {
    marginTop: spacing.md,
  },
  buttonSecondary: {
    marginTop: spacing.sm,
  },
});

export default LoginScreen;
