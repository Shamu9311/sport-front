import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '../../theme';

type ToastBaseProps = {
  text1?: string;
  text2?: string;
  props?: { actionLabel?: string };
  onPress?: () => void;
};

const iconByType: Record<string, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
};

const accentByType: Record<string, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.info,
  warning: colors.warning,
};

function ToastCard({
  type,
  text1,
  text2,
  props,
  onPress,
}: ToastBaseProps & { type: keyof typeof iconByType }) {
  const actionLabel = props?.actionLabel;
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { borderLeftColor: accentByType[type] }]}>
        <Ionicons name={iconByType[type]} size={22} color={accentByType[type]} />
        <View style={styles.textBlock}>
          {text1 ? (
            <Text style={styles.text1} numberOfLines={2}>
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text style={styles.text2} numberOfLines={3}>
              {text2}
            </Text>
          ) : null}
        </View>
        {actionLabel && onPress ? (
          <TouchableOpacity onPress={onPress} style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export const appToastConfig = {
  success: (p: ToastBaseProps) => <ToastCard type="success" {...p} />,
  error: (p: ToastBaseProps) => <ToastCard type="error" {...p} />,
  info: (p: ToastBaseProps) => <ToastCard type="info" {...p} />,
  warning: (p: ToastBaseProps) => <ToastCard type="warning" {...p} />,
};

const styles = StyleSheet.create({
  wrap: {
    width: '92%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  textBlock: {
    flex: 1,
  },
  text1: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  text2: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.primaryText,
  },
});
