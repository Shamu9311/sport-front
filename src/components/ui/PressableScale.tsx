import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { hapticLight, hapticSuccess, hapticSelection } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticKind = 'light' | 'success' | 'selection' | 'none';

type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  /** Escala al presionar (por defecto 0.97) */
  scaleTo?: number;
  /** Feedback háptico al presionar */
  haptic?: HapticKind;
  children?: React.ReactNode;
};

async function triggerHaptic(kind: HapticKind) {
  switch (kind) {
    case 'light':
      await hapticLight();
      break;
    case 'success':
      await hapticSuccess();
      break;
    case 'selection':
      await hapticSelection();
      break;
    default:
      break;
  }
}

/**
 * Pressable con feedback táctil sutil (scale + opacity, ~150 ms).
 * Respeta Reduce Motion del sistema.
 */
export default function PressableScale({
  style,
  scaleTo = 0.97,
  haptic = 'none',
  children,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    opacity: 1 - pressed.value * 0.08,
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, reducedMotion ? undefined : animatedStyle]}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 120 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 150 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic !== 'none') {
          void triggerHaptic(haptic);
        }
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
