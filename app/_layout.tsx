// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1919',
        }}
      >
        <ActivityIndicator size='large' color='#D4AF37' />
      </View>
    );
  }

  return (
    <Stack initialRouteName={user ? '(tabs)' : 'login'}>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='login' options={{ headerShown: false }} />
      <Stack.Screen name='register' options={{ headerShown: false }} />
      <Stack.Screen name='loading-profile' options={{ headerShown: false }} />
      <Stack.Screen name='create-profile' options={{ headerShown: false }} />
    </Stack>
  );
}

function useProtectedRoute() {
  // Toda la lógica de autenticación y protección de rutas se ha movido al AuthContext
  // Esta función ahora solo sirve como un "hook" para que las rutas se renderizen correctamente
  // La verdadera protección ocurre en el AuthContext

  const { handleRouteChanges } = useAuth();
  const segments = useSegments();

  // Usamos un efecto para verificar el estado de autenticación y perfil solo
  // cuando los segmentos de ruta cambian, no en la primera renderización
  useEffect(() => {
    // Solo llamamos a handleRouteChanges después de la primera renderización
    const timeout = setTimeout(() => {
      handleRouteChanges();
    }, 100);

    return () => clearTimeout(timeout);
  }, [segments.join('/')]);

  return <Slot />;
}
