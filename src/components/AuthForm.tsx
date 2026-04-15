import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type Field = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
};

type AuthFormProps = {
  fields: Field[];
};

const AuthForm: React.FC<AuthFormProps> = ({ fields }) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {fields.map((field, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[
              styles.input,
              focusedIndex === index && styles.inputFocused,
            ]}
            value={field.value}
            returnKeyType="next"
            onChangeText={field.onChangeText}
            secureTextEntry={field.secure || false}
            autoCapitalize={field.autoCapitalize ?? 'none'}
            keyboardType={field.keyboardType ?? 'default'}
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '80%',
    maxWidth: 400,
    alignSelf: 'center',
    marginVertical: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  label: {
    ...typography.body1,
    marginBottom: spacing.xs,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    fontSize: typography.body1.fontSize,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
});

export default AuthForm;
