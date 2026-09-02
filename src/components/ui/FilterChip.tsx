import React from 'react';
import { Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '../../theme';
import PressableScale from './PressableScale';

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  /** Color cuando está seleccionado (p. ej. color de categoría) */
  selectedColor?: string;
};

/** Chip compacto de filtro con color de acento configurable. */
export default function FilterChip({
  label,
  selected,
  onPress,
  iconName,
  style,
  selectedColor = colors.primary,
}: FilterChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.95}
      haptic="selection"
      style={[
        styles.chip,
        selected
          ? { backgroundColor: selectedColor }
          : styles.chipUnselected,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={14}
          color={selected ? colors.textOnPrimary : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    minHeight: 32,
  },
  chipUnselected: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
  },
  labelSelected: {
    color: colors.textOnPrimary,
  },
  labelUnselected: {
    color: colors.textSecondary,
  },
});
