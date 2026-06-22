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
 * Flujo de login; la verificación de perfil la gestiona AuthContext vía /loading-profile.
 */
export function useLoginWithProfileRedirect() {
  const router = useRouter();
  const { login } = useAuth();

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
      if (response?.user && response?.token) {
        if (!response.user.id) {
          onIncompleteUser();
          return;
        }
        const userData = {
          id: response.user.id,
          username: response.user.username || '',
          email: response.user.email || '',
          created_at: response.user.created_at || new Date().toISOString(),
        };
        await login(userData, response.token);
        router.replace('/loading-profile');
      } else {
        onIncompleteUser();
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Ocurrió un error inesperado durante el inicio de sesión.';
      if (error.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      onError(errorMessage);
    }
  };

  return { submitLogin };
}
