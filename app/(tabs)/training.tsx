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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { colors, fontFamily, radius, shadows, spacing } from '../../src/theme';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import EmptyState from '../../src/components/ui/EmptyState';
import PressableScale from '../../src/components/ui/PressableScale';
import Toast from 'react-native-toast-message';
import { TrainingSession, SavedRecommendation } from '../../src/types/UserTypes';

export default function TrainingScreen() {
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
  const pendingDeletesRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

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

  // Eliminación optimista con opción de deshacer (~4 s antes de confirmar en el servidor)
  const UNDO_DELETE_MS = 4000;

  const handleDeleteSession = (session: TrainingSession) => {
    const sessionId = session.session_id;
    const index = trainingSessions.findIndex((s) => s.session_id === sessionId);
    if (index === -1) return;

    // Quitar de la lista inmediatamente (estado optimista)
    setTrainingSessions((prev) => prev.filter((s) => s.session_id !== sessionId));

    const restoreSession = () => {
      setTrainingSessions((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, session);
        return next;
      });
    };

    const timer = setTimeout(async () => {
      pendingDeletesRef.current.delete(sessionId);
      try {
        await deleteTrainingSession(sessionId);
      } catch (error) {
        console.error('Error deleting session:', error);
        restoreSession();
        Toast.show({
          type: 'error',
          text1: 'No se pudo eliminar',
          text2: 'El entrenamiento fue restaurado. Intenta de nuevo.',
        });
      }
    }, UNDO_DELETE_MS);

    pendingDeletesRef.current.set(sessionId, timer);

    Toast.show({
      type: 'info',
      text1: 'Entrenamiento eliminado',
      text2: 'Toca aquí para deshacer',
      visibilityTime: UNDO_DELETE_MS,
      onPress: () => {
        const pending = pendingDeletesRef.current.get(sessionId);
        if (pending) {
          clearTimeout(pending);
          pendingDeletesRef.current.delete(sessionId);
          restoreSession();
        }
        Toast.hide();
      },
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style='light' />

        {/* Header renovado */}
        <View style={[styles.header, { paddingTop: 8 }]}>
          <View>
            <Text style={styles.headerTitle}>Entrenamientos</Text>
            <Text style={styles.headerSubtitle}>Registra y monitorea tu progreso</Text>
          </View>
          <PressableScale
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            haptic="light"
            accessibilityRole='button'
            accessibilityLabel='Agregar nuevo entrenamiento'
          >
            <Ionicons name='add' size={20} color={colors.textOnPrimary} />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </PressableScale>
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
            <EmptyState
              iconName='barbell-outline'
              title='No hay entrenamientos'
              subtitle='Registra tu primer entrenamiento para comenzar a recibir recomendaciones personalizadas'
              style={styles.emptyState}
              action={
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowAddModal(true)}
                  accessibilityRole='button'
                >
                  <Ionicons name='add' size={20} color={colors.textOnPrimary} />
                  <Text style={styles.addButtonText}>Agregar Entrenamiento</Text>
                </TouchableOpacity>
              }
            />
          ) : (
            <View style={styles.sessionsList}>
              <View style={styles.sessionsHeader}>
                <Text style={styles.sessionsCount}>
                  {trainingSessions.length}{' '}
                  {trainingSessions.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                </Text>
                <Text style={styles.swipeHint}>← Desliza para eliminar</Text>
              </View>
              {trainingSessions.map((session, index) => (
                <Animated.View
                  key={session.session_id}
                  entering={FadeInDown.duration(250).delay(Math.min(index, 6) * 40)}
                >
                  <TrainingSessionItem
                    session={session}
                    onPress={handleSessionPress}
                    onDelete={handleDeleteSession}
                  />
                </Animated.View>
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
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
    flexDirection: 'row',
    ...shadows.card,
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
    marginTop: 40,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: 13,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    ...shadows.card,
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
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  swipeHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
