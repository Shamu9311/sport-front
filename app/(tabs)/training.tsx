import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  getUserTrainingSessions,
  createTrainingSession,
  deleteTrainingSession,
  getTrainingSession,
  getNotificationPreferences,
  pollTrainingRecommendations,
} from '../../src/services/api';
import TrainingSessionItem from '../../src/components/TrainingSessionItem';
import AddTrainingModal from '../../src/components/AddTrainingModal';
import TrainingDetailModal from '../../src/components/TrainingDetailModal';
import NotificationService, {
  parseIntervalMinutesFromInstructions,
} from '../../src/services/notificationService';
import { colors, fontFamily } from '../../src/theme';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import Toast from 'react-native-toast-message';
import { TrainingSession, SavedRecommendation } from '../../src/types/UserTypes';

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [prefetchedRecommendations, setPrefetchedRecommendations] = useState<
    SavedRecommendation[] | null
  >(null);
  const [prefetchedRecsLoading, setPrefetchedRecsLoading] = useState(false);
  const [usePrefetchedRecs, setUsePrefetchedRecs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (user?.id) {
      fetchTrainingSessions();
    }
  }, [user?.id]);

  const fetchTrainingSessions = async (isRefresh = false) => {
    if (!user || !user.id) return;
    if (isFetchingRef.current && !isRefresh) return;

    isFetchingRef.current = true;
    try {
      if (!isRefresh) setLoading(true);
      const sessions = await getUserTrainingSessions(user.id);
      setTrainingSessions(sessions);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'No se pudieron cargar los entrenamientos');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrainingSessions(true);
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
        setPrefetchedRecommendations(null);
        setPrefetchedRecsLoading(true);
        setUsePrefetchedRecs(true);
        setShowDetailModal(true);

        const [recommendations] = await Promise.all([
          pollTrainingRecommendations(fullSession.session_id),
          fetchTrainingSessions(true),
        ]);

        if (recommendations.length > 0) {
          setPrefetchedRecommendations(recommendations);
          setPrefetchedRecsLoading(false);
          await scheduleConsumptionNotifications(fullSession, recommendations);
        } else {
          setUsePrefetchedRecs(false);
          setPrefetchedRecsLoading(false);
        }
      } else {
        await fetchTrainingSessions(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error adding training session:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo agregar el entrenamiento');
    }
  };

  const scheduleConsumptionNotifications = async (
    session: TrainingSession,
    recommendations: SavedRecommendation[]
  ) => {
    if (!user?.id) return;

    try {
      const prefs = await getNotificationPreferences(user.id);
      const consumptionEnabled =
        prefs?.data?.consumption_reminders === true ||
        prefs?.data?.consumption_reminders === 1;
      if (!consumptionEnabled) {
        return;
      }

      const dateStr = session.session_date.split('T')[0];
      const timeStr = session.start_time || '18:00:00';
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      const sessionDate = new Date(year, month - 1, day, hours, minutes, 0);
      const preferredTime = prefs?.data?.preferred_time?.substring(0, 5) ?? '09:00';

      let programadas = 0;
      for (const rec of recommendations) {
        if (rec.consumption_timing && rec.product_name) {
          const intervalMin = parseIntervalMinutesFromInstructions(rec.consumption_instructions);

          const notifIds = await NotificationService.scheduleConsumptionReminder(
            rec.product_name,
            rec.consumption_timing,
            rec.timing_minutes,
            sessionDate,
            session.duration_min,
            intervalMin,
            preferredTime
          );
          programadas += notifIds.length;
        }
      }

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

  const handleSessionPress = (session: TrainingSession) => {
    setUsePrefetchedRecs(false);
    setPrefetchedRecommendations(null);
    setPrefetchedRecsLoading(false);
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
            fetchTrainingSessions();
            Toast.show({
              type: 'success',
              text1: 'Entrenamiento eliminado',
              text2: 'La sesión se eliminó correctamente.',
            });
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
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <View>
            <Text style={styles.headerTitle}>Entrenamientos</Text>
            <Text style={styles.headerSubtitle}>Registra y monitorea tu progreso</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name='add-circle' size={24} color={colors.textOnPrimary} />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonLoader type='trainingList' />
            </View>
          ) : trainingSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='barbell-outline'
                size={80}
                color={colors.primary}
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
                <Ionicons name='add-circle' size={22} color={colors.textOnPrimary} />
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
            onClose={() => {
              setShowDetailModal(false);
              setUsePrefetchedRecs(false);
              setPrefetchedRecommendations(null);
              setPrefetchedRecsLoading(false);
            }}
            session={selectedSession}
            userId={user?.id || 0}
            usePrefetchedRecommendations={usePrefetchedRecs}
            prefetchedRecommendations={prefetchedRecommendations}
            prefetchedRecommendationsLoading={prefetchedRecsLoading}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 15,
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignSelf: 'stretch',
    paddingTop: 8,
  },
  loadingText: {
    color: colors.textSecondary,
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
    color: colors.primary,
    fontSize: 22,
    fontFamily: fontFamily.bold,
    marginBottom: 12,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: colors.primary,
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
    color: colors.primary,
    fontSize: 16,
    fontFamily: fontFamily.bold,
  },
  swipeHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
