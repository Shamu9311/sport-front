import * as React from 'react';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../services/api';
import { useRouter, useSegments } from 'expo-router';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  userToken: string | null;
  isLoadingAuth: boolean;
  hasProfile: boolean | null; // null significa que aún no se ha verificado
  isCheckingProfile: boolean;
  profileVerified: boolean; // Nuevo flag para indicar que la verificación ha terminado
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkUserProfile: () => Promise<boolean>;
  setHasProfile: (value: boolean) => void;
  handleRouteChanges: () => void; // Nueva función para manejar cambios de ruta
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [profileVerified, setProfileVerified] = useState(false);
  const [redirectingFromAuth, setRedirectingFromAuth] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  // Usar un ref para saber si el componente está montado
  const mountedRef = React.useRef(false);

  // Establecer el componente como montado después de un retraso
  useEffect(() => {
    mountedRef.current = true;
    setIsMounted(true);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar sesión guardada al iniciar la app
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setUserToken(storedToken);
          console.log('✅ Sesión recuperada:', userData.username);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    loadStoredSession();
  }, []);

  // Verificar si el usuario tiene un perfil
  const checkUserProfile = async (): Promise<boolean> => {
    if (!user) return false;

    setIsCheckingProfile(true);
    setProfileVerified(false); // Reiniciamos el flag de verificación completa

    try {
      const response = await getProfile(user.id);
      // Verificar si el perfil existe en la respuesta
      const profileExists = response?.success && response.data?.profile !== null;

      console.log('Verificación de perfil:', profileExists ? 'Perfil encontrado' : 'Sin perfil');

      // Actualizar el estado del perfil
      setHasProfile(profileExists);

      // Marcar la verificación como completa
      setProfileVerified(true);

      return profileExists;
    } catch (error) {
      // Este catch solo se ejecutará para errores no manejados en getProfile
      console.error('Error verificando perfil de usuario:', error);
      setHasProfile(false);
      setProfileVerified(true); // Aún con error, la verificación está completa
      return false;
    } finally {
      setIsCheckingProfile(false);
    }
  };

  // Control directo de navegación basado en el estado de autenticación y perfil
  const handleRouteChanges = () => {
    // CRÍTICO: No intentar ninguna navegación hasta que el componente esté montado
    if (!mountedRef.current || !isMounted) {
      console.log('Evitando navegación temprana: componente aún no montado');
      return;
    }

    const isPublicRoute = ['login', 'register'].includes(segments[0] || '');
    const isProfileCreationRoute = segments[0] === 'create-profile';
    // const isHomeRoute = segments[0] === '' || segments[0] === undefined;

    // No hacer ninguna redirección mientras verificamos el perfil
    if (isCheckingProfile) {
      return;
    }

    // Si no hay usuario, redirigir a login en rutas protegidas
    if (!user && !isPublicRoute) {
      console.log('Redirigiendo a login: usuario no autenticado');
      router.replace('/login');
      return;
    }

    // Si hay usuario autenticado
    if (user) {
      // Si ya verificamos el perfil
      if (profileVerified) {
        if (hasProfile) {
          // Si está en login/register, redirigir a home
          if (isPublicRoute) {
            console.log('Redirigiendo a home: usuario autenticado con perfil (desde ruta pública)');
            router.replace('/');
          } else if (isProfileCreationRoute) {
            // Si está en creación de perfil pero ya tiene perfil, redirigir a home
            console.log('Redirigiendo a home: usuario ya tiene perfil');
            router.replace('/');
          }
        } else {
          // Si no tiene perfil y no está en la página de creación, redirigir a creación
          if (!isProfileCreationRoute) {
            console.log('Redirigiendo a creación de perfil: usuario sin perfil');
            setRedirectingFromAuth(true);
            router.replace('/create-profile');
          }
        }
        return;
      }
      // Si aún no hemos verificado el perfil, esperamos
      console.log('Esperando verificación de perfil...');
      return;
    }
  };

  // Verificar automáticamente el perfil cuando cambia el usuario
  useEffect(() => {
    if (user) {
      checkUserProfile();
    } else {
      setHasProfile(null);
      setProfileVerified(false);
    }
  }, [user]);

  // Efecto para manejar navegación automática basada en el estado actual
  useEffect(() => {
    if (!isLoadingAuth && !isCheckingProfile) {
      handleRouteChanges();
    }
  }, [user, hasProfile, profileVerified, segments, isLoadingAuth, isCheckingProfile]);

  // Resetear el flag de redirección cuando cambia la ruta
  useEffect(() => {
    setRedirectingFromAuth(false);
  }, [segments[0]]);

  const login = async (userData: User, token?: string) => {
    setIsLoadingAuth(true);
    try {
      setUser(userData);
      const authToken = token || 'default-token';
      setUserToken(authToken);

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', authToken);

      console.log('✅ Sesión guardada para:', userData.username);
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');

      // Limpiar estado
      setUser(null);
      setUserToken(null);
      setHasProfile(null);
      setProfileVerified(false);

      console.log('✅ Sesión cerrada y limpiada');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userToken,
        isLoadingAuth,
        hasProfile,
        isCheckingProfile,
        profileVerified,
        login,
        logout,
        checkUserProfile,
        setHasProfile,
        handleRouteChanges,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
