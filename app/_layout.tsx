// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.primary, backgroundColor: colors.surface }}
      text1Style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}
      text2Style={{ fontSize: 13, color: colors.textMuted }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.error, backgroundColor: colors.surface }}
      text1Style={{ fontSize: 15, color: colors.textPrimary }}
      text2Style={{ fontSize: 13, color: colors.textMuted }}
    />
  ),
};

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
          <Toast config={toastConfig} />
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
