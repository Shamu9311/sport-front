import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { radius, spacing } from '../../theme';

type ProductImageFrameProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Marco blanco deliberado para fotos de producto (que vienen con fondo blanco).
 * Sobre el tema oscuro evita que las imágenes se vean como PNG flotantes.
 */
export default function ProductImageFrame({ children, style }: ProductImageFrameProps) {
  return <View style={[styles.frame, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
});
