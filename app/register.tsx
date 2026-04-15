import React, { useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthForm from '../src/components/AuthForm';
import CustomButton from '../src/components/CustomButton';
import { registerUser, loginUser } from '../src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing } from '../src/theme';
import { isValidEmail } from '../src/utils/validation';

const RegisterScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Introduce un correo electrónico válido.');
      return;
    }

    try {
      const response = await registerUser({ username, email, password });

      if (response.success) {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada correctamente. Ahora vamos a configurar tu perfil para personalizar tu experiencia.',
          [
            {
              text: 'Continuar',
              onPress: async () => {
                try {
                  const loginResponse = await loginUser(email, password);
                  if (loginResponse && loginResponse.user) {
                    const userData = {
                      id: loginResponse.user.id,
                      username: loginResponse.user.username,
                      email: loginResponse.user.email,
                      created_at: loginResponse.user.created_at || new Date().toISOString(),
                    };

                    await login(userData, loginResponse.token);
                    router.replace('/create-profile');
                  }
                } catch (loginError) {
                  console.error('Error al iniciar sesión automáticamente:', loginError);
                  router.replace('/login');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error de Registro', response.message || 'No se pudo completar el registro.');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorResponse = error.response;
      let errorMessage = 'Ocurrió un error inesperado durante el registro.';

      if (errorResponse) {
        if (errorResponse.status === 409) {
          errorMessage =
            errorResponse.data?.message ||
            'El correo electrónico o nombre de usuario ya están en uso.';
        } else if (errorResponse.data?.message) {
          errorMessage = errorResponse.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      Alert.alert('Error de Registro', errorMessage);
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
                  label: 'Nombre de usuario',
                  value: username,
                  onChangeText: setUsername,
                  autoCapitalize: 'none',
                },
                {
                  label: 'Email',
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
                  autoCapitalize: 'none',
                },
              ]}
            />
            <CustomButton
              title="GUARDAR REGISTRO"
              iconName="save-outline"
              iconPosition="right"
              iconSize={24}
              variant="primary"
              onPress={handleRegister}
              style={styles.buttonPrimary}
            />
            <CustomButton
              title="YA TENGO CUENTA (LOGIN)"
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
    marginBottom: spacing.xl,
  },
  buttonPrimary: {
    marginTop: spacing.md,
  },
  buttonSecondary: {
    marginTop: spacing.sm,
  },
});

export default RegisterScreen;
