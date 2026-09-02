import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme';

type MetricCardProps = {
  /** Valor grande (número o nodo, p. ej. AnimatedNumber) */
  value: React.ReactNode;
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

/** Métrica deportiva: número grande y etiqueta pequeña, en card ligera. */
export default function MetricCard({ value, label, iconName, style }: MetricCardProps) {
  return (
    <View style={[styles.card, style]} accessible accessibilityLabel={`${label}`}>
      {iconName ? <Ionicons name={iconName} size={16} color={colors.primary} /> : null}
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={styles.value}>{value}</Text>
      ) : (
        <View style={styles.valueWrap}>{value}</View>
      )}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.card,
  },
  value: {
    fontSize: 26,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  valueWrap: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
});
