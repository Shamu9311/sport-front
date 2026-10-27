import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  getUserTrainingSessions,
  createTrainingSession,
  updateTrainingSession,
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
import { notify } from '../../src/services/feedback';
import { groupTrainingSessions } from '../../src/utils/format';
import { TrainingSession, SavedRecommendation } from '../../src/types/UserTypes';

const SWIPE_HINT_KEY = 'training_swipe_hint_seen';

export default function TrainingScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
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

  useEffect(() => {
    AsyncStorage.getItem(SWIPE_HINT_KEY).then((v) => {
      if (!v) setShowSwipeHint(true);
    });
  }, []);

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
        notify.error('No se pudieron cargar los entrenamientos');
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

  const openCreateModal = () => {
    setFormMode('create');
    setEditingSession(null);
    setShowAddModal(true);
  };

  const openEditModal = (session: TrainingSession) => {
    setFormMode('edit');
    setEditingSession(session);
    setShowAddModal(true);
  };

  const handleSaveTraining = async (trainingData: Record<string, unknown>) => {
    if (!user || !user.id) return;

    try {
      if (formMode === 'edit' && editingSession) {
        const response = await updateTrainingSession(editingSession.session_id, trainingData);
        setShowAddModal(false);
        await fetchTrainingSessions(true);
        notify.success('Entrenamiento actualizado', {
          text2: response.recommendationsRegenerating
            ? 'Estamos actualizando tus recomendaciones.'
            : undefined,
        });
        const updated = await getTrainingSession(editingSession.session_id);
        setSelectedSession(updated);
        setPrefetchedRecommendations(null);
        setPrefetchedRecsLoading(!!response.recommendationsRegenerating);
        setUsePrefetchedRecs(!!response.recommendationsRegenerating);
        setShowDetailModal(true);
        if (response.recommendationsRegenerating) {
          const recommendations = await pollTrainingRecommendations(updated.session_id);
          setPrefetchedRecommendations(recommendations);
          setPrefetchedRecsLoading(false);
          if (recommendations.length > 0) {
            await scheduleConsumptionNotifications(updated, recommendations);
          }
        }
        return;
      }

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

    } catch (error) {
      console.error('Error saving training session:', error);
      notify.fromError(error, 'No se pudo guardar el entrenamiento');
      throw error;
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
          if (notifIds.length) {
            await NotificationService.registerSessionNotificationIds(
              session.session_id,
              notifIds
            );
          }
        }
      }

      if (programadas > 0) {
        notify.info('Recordatorios programados', {
          text2: `Se programaron ${programadas} avisos de consumo.`,
        });
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
        await NotificationService.cancelSessionNotifications(sessionId);
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

    if (showSwipeHint) {
      AsyncStorage.setItem(SWIPE_HINT_KEY, '1');
      setShowSwipeHint(false);
    }

    Toast.show({
      type: 'info',
      text1: 'Entrenamiento eliminado',
      text2: 'Puedes deshacer esta acción',
      visibilityTime: UNDO_DELETE_MS,
      props: { actionLabel: 'Deshacer' },
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

  const sections = groupTrainingSessions(trainingSessions);

  return (
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
            onPress={openCreateModal}
            haptic="light"
            accessibilityRole='button'
            accessibilityLabel='Agregar nuevo entrenamiento'
          >
            <Ionicons name='add' size={20} color={colors.textOnPrimary} />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </PressableScale>
        </View>

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
                onPress={openCreateModal}
                accessibilityRole='button'
              >
                <Ionicons name='add' size={20} color={colors.textOnPrimary} />
                <Text style={styles.addButtonText}>Agregar Entrenamiento</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <SectionList
            style={styles.content}
            sections={sections}
            keyExtractor={(item) => String(item.session_id)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListHeaderComponent={
              <View style={styles.sessionsHeader}>
                <Text style={styles.sessionsCount}>
                  {trainingSessions.length}{' '}
                  {trainingSessions.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                </Text>
                {showSwipeHint ? (
                  <Text style={styles.swipeHint}>Desliza ← eliminar · → editar</Text>
                ) : null}
              </View>
            }
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionTitle}>{title}</Text>
            )}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(250).delay(Math.min(index, 6) * 40)}>
                <TrainingSessionItem
                  session={item}
                  onPress={handleSessionPress}
                  onDelete={handleDeleteSession}
                  onEdit={openEditModal}
                />
              </Animated.View>
            )}
            contentContainerStyle={styles.sessionsList}
          />
        )}

        {/* Modal para agregar entrenamiento */}
        <AddTrainingModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveTraining}
          mode={formMode}
          initialSession={editingSession}
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
            onEdit={openEditModal}
          />
        )}
      </SafeAreaView>
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
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
