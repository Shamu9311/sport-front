import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Feedback táctil ligero para chips, tabs y cards presionables. */
export async function hapticLight() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Dispositivo sin soporte de haptics
  }
}

/** Feedback de éxito al guardar entrenamiento o dar feedback positivo. */
export async function hapticSuccess() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Dispositivo sin soporte de haptics
  }
}

/** Feedback de selección para tabs y toggles. */
export async function hapticSelection() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Dispositivo sin soporte de haptics
  }
}
