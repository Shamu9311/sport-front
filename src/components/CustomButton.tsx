import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '../theme';

type Variant = 'primary' | 'outline';

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  style?: object;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  iconSize?: number;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  iconName,
  iconPosition = 'left',
  iconColor,
  iconSize = 20,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}) => {
  const isOutline = variant === 'outline';
  const resolvedIconColor =
    iconColor ?? (isOutline ? colors.primary : colors.textOnPrimary);

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline ? colors.primary : colors.textOnPrimary}
        />
      ) : (
        <>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={resolvedIconColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              isOutline ? styles.buttonTextOutline : styles.buttonTextPrimary,
            ]}
          >
            {title}
          </Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={resolvedIconColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (isOutline) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          fullWidth && styles.buttonFullWidth,
          styles.buttonOutline,
          (disabled || loading) && styles.buttonDisabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        fullWidth && styles.buttonFullWidth,
        (disabled || loading) && styles.buttonDisabled,
        styles.buttonShadow,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryPressed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, styles.buttonPrimary]}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonFullWidth: {
    width: '80%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  buttonPrimary: {
    width: '100%',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  buttonShadow: {
    ...shadows.buttonPrimary,
    borderRadius: radius.md,
    alignSelf: 'center',
    width: '80%',
    maxWidth: 400,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: colors.textOnPrimary,
  },
  buttonTextOutline: {
    color: colors.primaryText,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default CustomButton;
