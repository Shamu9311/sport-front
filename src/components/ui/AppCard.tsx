import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

type AppCardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  /** Sin padding interno (útil cuando la card contiene una imagen a sangre) */
  noPadding?: boolean;
  /** Card destacada con borde superior rojo y fondo elevado */
  highlight?: boolean;
  children?: React.ReactNode;
};

/** Card estándar u highlight con borde, radio y sombra consistentes. */
export default function AppCard({
  style,
  noPadding = false,
  highlight = false,
  children,
  ...rest
}: AppCardProps) {
  return (
    <View
      style={[
        styles.card,
        highlight && styles.cardHighlight,
        !noPadding && styles.padding,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHighlight: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    ...shadows.cardElevated,
  },
  padding: {
    padding: spacing.lg,
  },
});
