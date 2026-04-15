import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { isValidEmail } from '../utils/validation';

type LoginPayload = {
  email: string;
  password: string;
  onInvalidEmail: () => void;
  onMissingFields: () => void;
  onIncompleteUser: () => void;
  onError: (message: string) => void;
};

/**
 * Flujo de login + verificación de perfil (sin ir a tabs si el check falla de forma ambigua).
 */
export function useLoginWithProfileRedirect() {
  const router = useRouter();
  const { login, checkUserProfile } = useAuth();

  const submitLogin = async ({
    email,
    password,
    onInvalidEmail,
    onMissingFields,
    onIncompleteUser,
    onError,
  }: LoginPayload) => {
    if (!email || !password) {
      onMissingFields();
      return;
    }
    if (!isValidEmail(email)) {
      onInvalidEmail();
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
        const hasProfile = await checkUserProfile();
        if (hasProfile) {
          router.replace('/(tabs)');
        } else {
          router.replace('/create-profile');
        }
      } else {
        onIncompleteUser();
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Ocurrió un error inesperado durante el inicio de sesión.';
      const errorResponse = error.response;
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
      onError(errorMessage);
    }
  };

  return { submitLogin };
}
