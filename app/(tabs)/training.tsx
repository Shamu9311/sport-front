import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  getUserTrainingSessions,
  createTrainingSession,
  deleteTrainingSession,
  getTrainingSession,
  getNotificationPreferences,
  API_URL,
} from '../../src/services/api';
import TrainingSessionItem from '../../src/components/TrainingSessionItem';
import AddTrainingModal from '../../src/components/AddTrainingModal';
import TrainingDetailModal from '../../src/components/TrainingDetailModal';
import NotificationService from '../../src/services/notificationService';

const { width } = Dimensions.get('window');

export default function TrainingScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    if (user && user.id) {
      fetchTrainingSessions();
    }
  }, [user]);

  const fetchTrainingSessions = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      const sessions = await getUserTrainingSessions(user.id);
      setTrainingSessions(sessions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudieron cargar los entrenamientos');
    }
  };

  const handleAddTraining = async (trainingData: any) => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      const newSession = await createTrainingSession({
        userId: user.id,
        ...trainingData,
      });
      setShowAddModal(false);

      // Obtener la sesión y abrir el modal inmediatamente
      // El modal se encargará de reintentar obtener las recomendaciones
      if (newSession && newSession.session_id) {
        const fullSession = await getTrainingSession(newSession.session_id);
        setSelectedSession(fullSession);
        setShowDetailModal(true);

        // Programar notificaciones de consumo si están habilitadas
        await scheduleConsumptionNotifications(fullSession);
      }

      await fetchTrainingSessions(); // Refrescar la lista después de agregar
      setLoading(false);
    } catch (error) {
      console.error('Error adding training session:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo agregar el entrenamiento');
    }
  };

  const scheduleConsumptionNotifications = async (session: any) => {
    if (!user?.id) return;

    try {
      // Verificar si el usuario tiene habilitadas las notificaciones de consumo
      const prefs = await getNotificationPreferences(user.id);
      if (!prefs?.data?.consumption_reminders) {
        console.log('❌ Notificaciones de consumo desactivadas');
        return;
      }

      console.log('✅ Notificaciones de consumo activadas, programando...');

      // Función para intentar obtener recomendaciones con reintentos
      const fetchRecommendationsWithRetry = async (maxAttempts = 3, delayMs = 4000) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`🔄 Intento ${attempt}/${maxAttempts} de obtener recomendaciones...`);

          await new Promise((resolve) => setTimeout(resolve, delayMs));

          // Obtener recomendaciones directamente del endpoint correcto
          const response = await fetch(
            `${API_URL}/api/training/${session.session_id}/recommendations?userId=${user.id}`
          );
          const recommendations = await response.json();

          console.log(`📦 Respuesta del servidor:`, recommendations);

          if (recommendations && recommendations.length > 0) {
            console.log(`✅ ${recommendations.length} recomendaciones encontradas!`);
            const updatedSession = await getTrainingSession(session.session_id);
            return { session: updatedSession, recommendations };
          }

          console.log(`⏳ Aún no hay recomendaciones (intento ${attempt}/${maxAttempts})`);
        }

        console.log('❌ No se generaron recomendaciones después de varios intentos');
        return null;
      };

      const result = await fetchRecommendationsWithRetry();

      if (!result) {
        Alert.alert(
          'Sin recomendaciones',
          'No se pudieron generar recomendaciones para este entrenamiento. Intenta de nuevo más tarde.'
        );
        return;
      }

      const { session: updatedSession, recommendations } = result;

      // Combinar fecha y hora del entrenamiento correctamente
      const dateStr = updatedSession.session_date.split('T')[0]; // YYYY-MM-DD
      const timeStr = updatedSession.start_time || '18:00:00'; // HH:MM:SS

      // Crear fecha en zona horaria local
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);

      const sessionDate = new Date(year, month - 1, day, hours, minutes, 0);

      console.log(`🕐 Fecha del entrenamiento: ${dateStr}`);
      console.log(`🕐 Hora del entrenamiento: ${timeStr}`);
      console.log(`🕐 Fecha completa: ${sessionDate.toLocaleString()}`);
      console.log(`🕐 Hora actual: ${new Date().toLocaleString()}`);

      let programadas = 0;
      for (const rec of recommendations) {
        if (rec.consumption_timing && rec.product_name) {
          const notifId = await NotificationService.scheduleConsumptionReminder(
            rec.product_name,
            rec.consumption_timing,
            rec.timing_minutes,
            sessionDate
          );
          if (notifId) programadas++;
        }
      }

      console.log(`📅 ${programadas} notificaciones programadas exitosamente`);

      if (programadas > 0) {
        Alert.alert(
          '🔔 Notificaciones programadas',
          `Se programaron ${programadas} recordatorios de consumo`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error verificando preferencias:', error);
    }
  };

  const handleSessionPress = (session: any) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleDeleteSession = (session: any) => {
    Alert.alert('Eliminar Entrenamiento', '¿Estás seguro que deseas eliminar este entrenamiento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrainingSession(session.session_id);
            fetchTrainingSessions(); // Refrescar la lista
            Alert.alert('Éxito', 'Entrenamiento eliminado correctamente');
          } catch (error) {
            console.error('Error deleting session:', error);
            Alert.alert('Error', 'No se pudo eliminar el entrenamiento');
          }
        },
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style='light' />

        {/* Header renovado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Entrenamientos</Text>
            <Text style={styles.headerSubtitle}>Registra y monitorea tu progreso</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name='add-circle' size={24} color='#1a1919' />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color='#D4AF37' />
              <Text style={styles.loadingText}>Cargando entrenamientos...</Text>
            </View>
          ) : trainingSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='barbell-outline'
                size={80}
                color='#D4AF37'
                style={{ marginBottom: 20 }}
              />
              <Text style={styles.emptyStateTitle}>No hay entrenamientos</Text>
              <Text style={styles.emptyStateText}>
                Registra tu primer entrenamiento para comenzar a recibir recomendaciones
                personalizadas
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name='add-circle' size={22} color='#1a1919' />
                <Text style={styles.addButtonText}>Agregar Entrenamiento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              <View style={styles.sessionsHeader}>
                <Text style={styles.sessionsCount}>
                  {trainingSessions.length}{' '}
                  {trainingSessions.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                </Text>
                <Text style={styles.swipeHint}>← Desliza para eliminar</Text>
              </View>
              {trainingSessions.map((session) => (
                <TrainingSessionItem
                  key={session.session_id}
                  session={session}
                  onPress={handleSessionPress}
                  onDelete={handleDeleteSession}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Modal para agregar entrenamiento */}
        <AddTrainingModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTraining}
        />

        {/* Modal para ver detalles del entrenamiento */}
        {selectedSession && (
          <TrainingDetailModal
            visible={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            session={selectedSession}
            userId={user?.id || 0}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1919',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#1a1919',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#999',
  },
  addButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#1a1919',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 60,
  },
  emptyStateTitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sessionsList: {
    paddingTop: 16,
    paddingBottom: 30,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sessionsCount: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  swipeHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
