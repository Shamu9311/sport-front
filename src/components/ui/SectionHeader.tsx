import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, fontFamily, spacing } from '../../theme';

type SectionHeaderProps = {
  title: string;
  /** Texto secundario debajo del título */
  subtitle?: string;
  /** Etiqueta overline en mayúsculas encima del título (estilo SiS) */
  overline?: string;
  /** Elemento opcional alineado a la derecha (p. ej. un botón "Ver todo") */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Encabezado de sección con barra roja vertical y jerarquía tipográfica SiS. */
export default function SectionHeader({
  title,
  subtitle,
  overline,
  right,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.accentBar} accessibilityElementsHidden importantForAccessibility="no" />
      <View style={styles.textWrap}>
        {overline ? <Text style={styles.overline}>{overline}</Text> : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && !overline ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: spacing.md,
    marginTop: 2,
    minHeight: 28,
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  overline: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
