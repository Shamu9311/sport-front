import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let notificationsImport: Promise<NotificationsModule> | null = null;
let handlerRegistered = false;

/**
 * En Expo Go (StoreClient) las notificaciones remotas/locales están muy limitadas (SDK 53+)
 * y el paquete muestra warnings. No importamos el módulo ahí para evitar ruido en consola.
 * Para probar notificaciones reales: development build (`npx expo run:android` / `run:ios` o EAS Build).
 */
function isNotificationsModuleAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!isNotificationsModuleAvailable()) return null;
  if (!notificationsImport) {
    notificationsImport = import('expo-notifications');
  }
  const Notifications = await notificationsImport;
  if (!handlerRegistered) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerRegistered = true;
  }
  return Notifications;
}

/** Extrae interval_minutes persistido en consumption_instructions del backend */
export function parseIntervalMinutesFromInstructions(
  instructions?: string | null
): number | undefined {
  if (!instructions) return undefined;
  const match = instructions.match(/\[interval_minutes=(\d+)\]/);
  return match ? parseInt(match[1], 10) : undefined;
}

/** Limpia el prefijo técnico para mostrar instrucciones al usuario */
export function stripIntervalPrefixFromInstructions(instructions?: string | null): string {
  if (!instructions) return '';
  return instructions.replace(/\[interval_minutes=\d+\]\s*/, '').trim();
}

class NotificationService {
  /**
   * Solicitar permisos de notificaciones
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const Notifications = await getNotifications();
      if (!Notifications) return false;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus === 'denied') {
        return false;
      }

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C9A84C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Programar recordatorio(s) de consumo según timing del producto.
   * Para timing "durante" puede programar múltiples notificaciones según duración e intervalo.
   */
  static async scheduleConsumptionReminder(
    productName: string,
    timing: string,
    minutes?: number,
    trainingDate?: Date,
    sessionDurationMin?: number,
    intervalMin?: number,
    preferredDailyTime?: string
  ): Promise<string[]> {
    const scheduledIds: string[] = [];

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return scheduledIds;
      const Notifications = await getNotifications();
      if (!Notifications) return scheduledIds;

      const now = new Date();
      const trainingTime = trainingDate || now;

      switch (timing) {
        case 'antes': {
          const beforeTime = new Date(trainingTime.getTime() - (minutes || 30) * 60 * 1000);
          const trigger = beforeTime > now ? beforeTime : { seconds: 5 };
          const body =
            beforeTime > now
              ? `Consume ${productName} ahora, ${minutes || 30} minutos antes de tu entrenamiento`
              : `Recuerda consumir ${productName} antes de entrenar`;

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🏋️ Recordatorio de Consumo',
              body,
              sound: true,
            },
            trigger,
          });
          scheduledIds.push(id);
          break;
        }

        case 'durante': {
          const interval = intervalMin && intervalMin > 0 ? intervalMin : 30;
          const duration = sessionDurationMin && sessionDurationMin > 0 ? sessionDurationMin : 60;
          const count = Math.max(1, Math.floor(duration / interval));

          for (let i = 0; i < count; i++) {
            const fireAt = new Date(trainingTime.getTime() + i * interval * 60 * 1000);
            const trigger = fireAt > now ? fireAt : { seconds: 5 + i * 2 };
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: '🏃 Consumo durante entrenamiento',
                body: `Consume ${productName} ahora (vez ${i + 1}/${count})`,
                sound: true,
              },
              trigger,
            });
            scheduledIds.push(id);
          }
          break;
        }

        case 'despues': {
          const afterTime = new Date(trainingTime.getTime() + (minutes || 30) * 60 * 1000);
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🏋️ Recordatorio de Consumo',
              body: `Es momento de consumir ${productName} para recuperarte`,
              sound: true,
            },
            trigger: afterTime,
          });
          scheduledIds.push(id);
          break;
        }

        case 'diario': {
          const timeParts = (preferredDailyTime || '09:00').split(':');
          const hour = parseInt(timeParts[0], 10) || 9;
          const minute = parseInt(timeParts[1], 10) || 0;

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🏋️ Recordatorio de Consumo',
              body: `Recuerda tomar tu dosis diaria de ${productName}`,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour,
              minute,
              repeats: true,
            },
          });
          scheduledIds.push(id);
          break;
        }

        default:
          break;
      }

      return scheduledIds;
    } catch (error) {
      console.error('Error programando notificación:', error);
      return scheduledIds;
    }
  }

  /**
   * Programar alerta de entrenamiento
   */
  static async scheduleTrainingAlert(time: string): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;
      const Notifications = await getNotifications();
      if (!Notifications) return null;

      const [hours, minutes] = time.split(':').map(Number);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Hora de Entrenar',
          body: '¡Es momento de tu sesión de entrenamiento! Mantén tu rutina activa.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error programando alerta:', error);
      return null;
    }
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      const Notifications = await getNotifications();
      if (!Notifications) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelando notificaciones:', error);
    }
  }

  /**
   * Cancelar una notificación específica
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      const Notifications = await getNotifications();
      if (!Notifications) return;
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelando notificación:', error);
    }
  }

  /**
   * Obtener todas las notificaciones programadas
   */
  static async getAllScheduledNotifications() {
    try {
      const Notifications = await getNotifications();
      if (!Notifications) return [];
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }
}

export default NotificationService;
