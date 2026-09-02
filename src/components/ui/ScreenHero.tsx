import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ScreenHeroProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Altura del degradado superior (px) */
  gradientHeight?: number;
};

/**
 * Degradado sutil rojo SiS en la parte superior de pantallas.
 * Rompe el negro plano sin afectar legibilidad del contenido.
 */
export default function ScreenHero({ children, style, gradientHeight = 220 }: ScreenHeroProps) {
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={['rgba(232, 54, 45, 0.16)', 'transparent']}
        locations={[0, 1]}
        style={[styles.gradient, { height: gradientHeight }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});
