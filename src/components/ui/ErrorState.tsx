import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '../../theme';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function ErrorState({
  message,
  onRetry,
  retryLabel = 'Reintentar',
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name="alert-circle" size={56} color={colors.error} style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.85}>
          <Ionicons name="refresh" size={20} color={colors.textOnPrimary} />
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  message: {
    color: colors.error,
    fontSize: 16,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  retryText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
});
