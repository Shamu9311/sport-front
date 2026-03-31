// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetworkErrorBanner from '../src/components/NetworkErrorBanner';
import { colors, fontFamily } from '../src/theme';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const baseText = { fontFamily: fontFamily.regular };
    Text.defaultProps = Text.defaultProps ?? {};
    Text.defaultProps.style = StyleSheet.flatten([Text.defaultProps.style, baseText]);
    TextInput.defaultProps = TextInput.defaultProps ?? {};
    TextInput.defaultProps.style = StyleSheet.flatten([TextInput.defaultProps.style, baseText]);
    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <RootLayoutNav />
          <NetworkErrorBanner />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
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
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      initialRouteName={user ? '(tabs)' : 'login'}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.primary,
          fontFamily: fontFamily.semibold,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='login' options={{ headerShown: false }} />
      <Stack.Screen name='register' options={{ headerShown: false }} />
      <Stack.Screen name='loading-profile' options={{ headerShown: false }} />
      <Stack.Screen name='create-profile' options={{ headerShown: false }} />
      <Stack.Screen
        name='products/[productId]'
        options={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.primary,
          },
          headerShadowVisible: false,
          presentation: 'card',
        }}
      />
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
