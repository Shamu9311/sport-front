import React, { useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  Image,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AuthForm from '../src/components/AuthForm';
import CustomButton from '../src/components/CustomButton';
import { registerUser, loginUser } from '../src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const RegisterScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validación básica
    if (!username || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      // Llamada a la API para registrar al usuario
      const response = await registerUser({ username, email, password });

      if (response.success) {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada correctamente. Ahora vamos a configurar tu perfil para personalizar tu experiencia.',
          [
            {
              text: 'Continuar',
              onPress: async () => {
                // Intentar iniciar sesión automáticamente
                try {
                  const loginResponse = await loginUser(email, password);
                  if (loginResponse && loginResponse.user) {
                    // Llamar a la función login del contexto
                    const userData = {
                      id: loginResponse.user.id,
                      username: loginResponse.user.username,
                      email: loginResponse.user.email,
                      created_at: loginResponse.user.created_at || new Date().toISOString(),
                    };

                    await login(userData, loginResponse.token);

                    // Navegar a la pantalla de creación de perfil
                    router.replace('/create-profile');
                  }
                } catch (loginError) {
                  console.error('Error al iniciar sesión automáticamente:', loginError);
                  // Si falla el login automático, ir a la pantalla de login
                  router.replace('/login');
                }
              },
            },
          ]
        );
      } else {
        // Caso donde el API devuelve { success: false, message: '...' }
        Alert.alert('Error de Registro', response.message || 'No se pudo completar el registro.');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorResponse = error.response;
      let errorMessage = 'Ocurrió un error inesperado durante el registro.';

      if (errorResponse) {
        if (errorResponse.status === 409) {
          // Conflicto (ej: email ya existe)
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/login.png')} // <-- VERIFICA RUTA
          style={styles.logo}
          resizeMode='contain'
        />
        <AuthForm
          fields={[
            {
              label: 'Nombre de usuario',
              value: username,
              onChangeText: setUsername,
              autoCapitalize: 'none',
            }, // autoCapitalize none para username suele ser mejor
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
          title='GUARDAR REGISTRO' // Más específico
          iconColor='#1a1919'
          iconName='save-outline'
          iconPosition='right'
          iconSize={24}
          onPress={handleRegister}
          style={styles.button}
        />
        <CustomButton
          title='YA TENGO CUENTA (LOGIN)' // Más claro
          iconColor='#1a1919'
          iconName='log-in-outline'
          iconPosition='right'
          iconSize={24}
          // 4. CAMBIA navigation.navigate a router.push (o goBack si prefieres)
          onPress={() => router.push('/login')} // push añade login al historial
          // Alternativa: si quieres que actúe como el botón 'atrás':
          // onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

// ... (estilos igual)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1919',
  },
  logo: {
    height: 110,
    marginTop: -50, // Ajusta
    marginBottom: 30, // Espacio
  },
  button: {
    width: '80%',
    backgroundColor: '#D4AF37',
    marginTop: 15, // Espaciado entre botones y form
  },
});

export default RegisterScreen;
