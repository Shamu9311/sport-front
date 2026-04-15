import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme';

const LOADING_HINTS = [
  'Verificando tu perfil...',
  'Un momento por favor...',
  'Preparando la app...',
];

/**
 * Pantalla mostrada mientras AuthContext verifica si el usuario tiene perfil.
 * La navegación posterior la controla AuthContext (tabs o create-profile).
 */
const LoadingProfileScreen = () => {
  const { user } = useAuth();
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHintIndex((i) => (i + 1) % LOADING_HINTS.length);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Sport Funcional</Text>
      <Text style={styles.subtitle}>{LOADING_HINTS[hintIndex]}</Text>
      {user?.email ? (
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  email: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
  },
});

export default LoadingProfileScreen;
