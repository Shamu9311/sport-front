import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  /**
   * Solicitar permisos de notificaciones
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Si ya fueron denegados, informar al usuario
      if (existingStatus === 'denied') {
        console.log('⚠️ Permisos previamente denegados');
        return false;
      }

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificaciones denegados');
        return false;
      }

      console.log('✅ Permisos de notificaciones concedidos');

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
        });
      }

      return true;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Programar recordatorio de consumo basado en la hora del entrenamiento
   */
  static async scheduleConsumptionReminder(
    productName: string,
    timing: string,
    minutes?: number,
    trainingDate?: Date
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const now = new Date();
      const trainingTime = trainingDate || now;
      let trigger: any;
      let body = '';

      switch (timing) {
        case 'antes':
          // Notificar X minutos antes del entrenamiento
          const beforeTime = new Date(trainingTime.getTime() - (minutes || 30) * 60 * 1000);
          console.log(`⏰ Timing: ANTES - ${minutes || 30} min`);
          console.log(`⏰ Hora entrenamiento: ${trainingTime.toLocaleString()}`);
          console.log(`⏰ Hora notificación: ${beforeTime.toLocaleString()}`);
          console.log(`⏰ Hora actual: ${now.toLocaleString()}`);

          if (beforeTime > now) {
            trigger = beforeTime;
            body = `Consume ${productName} ahora, ${minutes || 30} minutos antes de tu entrenamiento`;
            console.log(`✅ Notificación programada para: ${beforeTime.toLocaleString()}`);
          } else {
            // Si ya pasó el tiempo, notificar inmediatamente
            trigger = { seconds: 5 };
            body = `Recuerda consumir ${productName} antes de entrenar`;
            console.log(`⚠️ Tiempo ya pasó, notificando inmediatamente`);
          }
          break;

        case 'durante':
          // Notificar al inicio del entrenamiento
          if (trainingTime > now) {
            trigger = trainingTime;
          } else {
            trigger = { seconds: 5 };
          }
          body = `Durante el entrenamiento, consume ${productName} para mantener tu energía`;
          break;

        case 'despues':
          // Notificar X minutos después del entrenamiento
          const afterTime = new Date(trainingTime.getTime() + (minutes || 30) * 60 * 1000);
          trigger = afterTime;
          body = `Es momento de consumir ${productName} para recuperarte`;
          break;

        case 'diario':
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: 9,
            minute: 0,
            repeats: true,
          };
          body = `Recuerda tomar tu dosis diaria de ${productName}`;
          break;

        default:
          return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏋️ Recordatorio de Consumo',
          body,
          sound: true,
        },
        trigger,
      });

      console.log(`✅ Notificación programada: ${productName} - ${timing}`);
      return notificationId;
    } catch (error) {
      console.error('Error programando notificación:', error);
      return null;
    }
  }

  /**
   * Programar alerta de entrenamiento
   */
  static async scheduleTrainingAlert(time: string): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

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
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }
}

export default NotificationService;

