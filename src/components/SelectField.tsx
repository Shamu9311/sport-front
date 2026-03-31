import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontFamily } from '../theme';

export type SelectOption<T extends string = string> = { label: string; value: T };

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  placeholder?: string;
};

export default function SelectField<T extends string>({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Seleccionar',
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.control}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.controlText} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={22} color={colors.primary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    opacity: 0.85,
    fontFamily: fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  controlText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginRight: spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '72%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.surfaceMuted,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
    flex: 1,
    paddingRight: spacing.sm,
  },
  optionTextActive: {
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
});
