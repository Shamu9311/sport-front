import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, fontFamily, spacing } from '../../theme';

type LoadingStateProps = {
  /** Mensaje fijo, o lista de mensajes que rotan progresivamente */
  messages?: string[];
  /** Intervalo de rotación de mensajes en ms */
  intervalMs?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Estado de carga elegante: spinner discreto + mensajes que cambian
 * progresivamente (sin inventar porcentajes de progreso).
 */
export default function LoadingState({
  messages = ['Cargando...'],
  intervalMs = 2200,
  style,
}: LoadingStateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1 < messages.length ? prev + 1 : prev));
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return (
    <View style={[styles.wrap, style]} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      <Animated.Text
        key={index}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
        style={styles.text}
      >
        {messages[index]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  text: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'normal',
  },
});
