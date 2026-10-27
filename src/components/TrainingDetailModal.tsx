import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api, { saveProductFeedback, unwrapApiPayload } from '../services/api';
import Toast from 'react-native-toast-message';
import { getProductImageSource } from '../utils/imageUtils';
import { colors, fontFamily, radius, shadows, spacing } from '../theme';
import LoadingState from './ui/LoadingState';
import ProductImageFrame from './ui/ProductImageFrame';
import { hapticSuccess } from '../utils/haptics';
import { formatStartTimeDisplay } from '../utils/format';
import { notify } from '../services/feedback';
import { SavedRecommendation, TrainingSession } from '../types/UserTypes';
import { stripIntervalPrefixFromInstructions } from '../services/notificationService';

const SEARCHING_MESSAGES = [
  'Analizando tu entrenamiento...',
  'Buscando productos adecuados...',
  'Generando recomendaciones personalizadas...',
];

const { width } = Dimensions.get('window');

interface TrainingDetailModalProps {
  visible: boolean;
  onClose: () => void;
  session: TrainingSession | null;
  userId: number;
  usePrefetchedRecommendations?: boolean;
  prefetchedRecommendations?: SavedRecommendation[] | null;
  prefetchedRecommendationsLoading?: boolean;
  onEdit?: (session: TrainingSession) => void;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity?.toLowerCase()) {
    case 'baja':
    case 'bajo':
      return colors.success;
    case 'media':
    case 'medio':
      return colors.warning;
    case 'alta':
    case 'alto':
      return colors.warning;
    case 'muy alta':
    case 'muy alto':
      return colors.error;
    default:
      return colors.textMuted;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'cardio':
      return 'run';
    case 'fuerza':
      return 'weight-lifter';
    case 'hiit':
      return 'lightning-bolt';
    case 'resistencia':
      return 'clock-time-eight';
    case 'mixed':
      return 'dumbbell';
    default:
      return 'dumbbell';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Using getProductImageSource from imageUtils.js

const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  visible,
  onClose,
  session,
  userId,
  usePrefetchedRecommendations = false,
  prefetchedRecommendations = null,
  prefetchedRecommendationsLoading = false,
  onEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SavedRecommendation[]>([]);
  const [feedbackStates, setFeedbackStates] = useState<{ [key: number]: string }>({});
  
  // Refs para control de estado
  const isMountedRef = useRef(true);
  const isVisibleRef = useRef(visible);
  
  // Actualizar ref de visible
  useEffect(() => {
    isVisibleRef.current = visible;
  }, [visible]);
  
  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const fetchRecommendationsWithRetry = useCallback(
    async (sessionId: number, retries = 5, delay = 2000) => {
      if (!sessionId) {
        console.warn('No hay session_id disponible para obtener recomendaciones');
        return;
      }
      for (let i = 0; i < retries; i++) {
        // Verificar si el modal sigue visible antes de continuar
        if (!isVisibleRef.current || !isMountedRef.current) {
          return;
        }
        
        try {
          setLoading(true);
          const response = await api.get(`/training/${sessionId}/recommendations`, {
            params: { userId },
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // Verificar nuevamente antes de actualizar estado
          if (!isVisibleRef.current || !isMountedRef.current) {
            return;
          }

          const payload = unwrapApiPayload<unknown[]>(response.data);
          const recommendationList = Array.isArray(payload) ? payload : [];

          if (recommendationList.length > 0) {
            setRecommendations(recommendationList);
            setLoading(false);
            return;
          }

          // Si no hay recomendaciones y no es el último intento, esperar y reintentar
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            console.warn('No se encontraron recomendaciones después de varios intentos');
            if (isVisibleRef.current && isMountedRef.current) {
              setRecommendations([]);
              setLoading(false);
            }
          }
        } catch (error: any) {
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            console.error('Error fetching recommendations después de varios intentos:', error);
            if (isVisibleRef.current && isMountedRef.current) {
              setRecommendations([]);
              setLoading(false);
            }
          }
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    if (visible && session && session.session_id) {
      if (usePrefetchedRecommendations) {
        setRecommendations(prefetchedRecommendations || []);
        setLoading(prefetchedRecommendationsLoading);
        return;
      }

      setRecommendations([]);
      setLoading(true);
      const timer = setTimeout(() => {
        fetchRecommendationsWithRetry(session.session_id);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!visible) {
      setRecommendations([]);
      setLoading(false);
    }
  }, [
    visible,
    session?.session_id,
    userId,
    fetchRecommendationsWithRetry,
    usePrefetchedRecommendations,
    prefetchedRecommendations,
    prefetchedRecommendationsLoading,
  ]);

  useEffect(() => {
    if (!usePrefetchedRecommendations || !visible) return;
    setRecommendations(prefetchedRecommendations || []);
    setLoading(prefetchedRecommendationsLoading);
  }, [
    usePrefetchedRecommendations,
    prefetchedRecommendations,
    prefetchedRecommendationsLoading,
    visible,
  ]);

  // Manejar feedback del usuario con animación
  const handleFeedback = async (productId: number, feedback: 'positivo' | 'negativo') => {
    // Actualizar estado inmediatamente para feedback visual
    setFeedbackStates((prev) => ({
      ...prev,
      [productId]: feedback,
    }));

    try {
      await saveProductFeedback(userId, productId, feedback);
      await hapticSuccess();
      Toast.show({
        type: 'success',
        text1: 'Gracias por tu opinión',
        text2: feedback === 'positivo' ? 'Registramos tu valoración positiva.' : 'Registramos tu valoración.',
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      // Revertir estado en caso de error
      setFeedbackStates((prev) => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      notify.error('No se pudo guardar tu feedback');
    }
  };

  const renderRecommendations = () => {
    if (loading) {
      return <LoadingState messages={SEARCHING_MESSAGES} style={styles.loadingContainer} />;
    }

    if (!recommendations || recommendations.length === 0) {
      return (
        <View style={styles.noRecommendations}>
          <Ionicons
            name='information-circle-outline'
            size={50}
            color={colors.textMuted}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.noRecommendationsText}>
            No hay recomendaciones disponibles en este momento.
          </Text>
          <Text style={styles.noRecommendationsSubtext}>
            Las recomendaciones se generan automáticamente al crear un entrenamiento.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recommendationsContainer}>
        <View style={styles.recommendationsHeader}>
          <Ionicons name='star' size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Productos Recomendados</Text>
        </View>
        {recommendations.map((rec, recIndex) => {
          // Función helper para obtener icono de timing
          const getTimingIcon = (timing: string) => {
            switch (timing) {
              case 'antes':
                return 'time-outline';
              case 'durante':
                return 'fitness-outline';
              case 'despues':
                return 'checkmark-circle-outline';
              case 'diario':
                return 'calendar-outline';
              default:
                return 'time-outline';
            }
          };

          const getTimingColor = (timing: string) => {
            switch (timing) {
              case 'antes':
                return colors.success;
              case 'durante':
                return colors.warning;
              case 'despues':
                return colors.info;
              case 'diario':
                return colors.info;
              default:
                return colors.primary;
            }
          };

          return (
            <View
              key={`rec-${rec.recommendation_id || rec.product_id}-${recIndex}`}
              style={styles.recommendationCard}
            >
              <Text style={styles.productName}>{rec.product_name}</Text>

              {rec.image_url ? (
                <ProductImageFrame style={styles.imageContainer}>
                  <Image
                    source={
                      rec.image_url.startsWith('http')
                        ? { uri: rec.image_url }
                        : getProductImageSource(rec.image_url)
                    }
                    style={styles.productImage}
                    resizeMode='contain'
                    onError={() => {}}
                  />
                </ProductImageFrame>
              ) : (
                <View style={[styles.imageContainer, styles.placeholderContainer]}>
                  <MaterialCommunityIcons name='image-off' size={40} color={colors.textMuted} />
                  <Text style={styles.placeholderText}>Imagen no disponible</Text>
                </View>
              )}

              {rec.feedback && (
                <View style={styles.reasoningBox}>
                  <Ionicons name='bulb' size={16} color={colors.primary} />
                  <Text style={styles.recommendationReason}>{rec.feedback}</Text>
                </View>
              )}

              {/* Guía de Consumo */}
              {(rec.consumption_timing ||
                rec.recommended_quantity ||
                rec.consumption_instructions) && (
                <View style={styles.consumptionGuide}>
                  <View style={styles.consumptionHeader}>
                    <Ionicons name='nutrition' size={20} color={colors.primary} />
                    <Text style={styles.consumptionTitle}>Cómo Consumir</Text>
                  </View>

                  {/* Cuándo consumir */}
                  {rec.consumption_timing && (
                    <View style={styles.consumptionItem}>
                      <Ionicons
                        name={getTimingIcon(rec.consumption_timing)}
                        size={18}
                        color={getTimingColor(rec.consumption_timing)}
                      />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Cuándo</Text>
                        <Text style={styles.consumptionValue}>
                          {rec.consumption_timing.charAt(0).toUpperCase() +
                            rec.consumption_timing.slice(1)}{' '}
                          del entrenamiento
                          {rec.timing_minutes && ` (${rec.timing_minutes} min)`}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Cantidad */}
                  {rec.recommended_quantity && (
                    <View style={styles.consumptionItem}>
                      <Ionicons name='flask' size={18} color={colors.primary} />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Cantidad</Text>
                        <Text style={styles.consumptionValue}>{rec.recommended_quantity}</Text>
                      </View>
                    </View>
                  )}

                  {/* Instrucciones */}
                  {rec.consumption_instructions && (
                    <View style={styles.consumptionItem}>
                      <Ionicons name='information-circle' size={18} color={colors.primary} />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Instrucciones</Text>
                        <Text style={styles.consumptionValue}>
                          {stripIntervalPrefixFromInstructions(rec.consumption_instructions)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Sección de Feedback */}
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackQuestion}>¿Te funcionó este producto?</Text>

                <View style={styles.feedbackButtons}>
                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      feedbackStates[rec.product_id] === 'positivo' &&
                        styles.feedbackButtonPositive,
                    ]}
                    onPress={() => handleFeedback(rec.product_id, 'positivo')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        feedbackStates[rec.product_id] === 'positivo'
                          ? 'thumbs-up'
                          : 'thumbs-up-outline'
                      }
                      size={20}
                      color={feedbackStates[rec.product_id] === 'positivo' ? colors.textOnPrimary : colors.success}
                    />
                    <Text
                      style={[
                        styles.feedbackButtonText,
                        feedbackStates[rec.product_id] === 'positivo' &&
                          styles.feedbackButtonTextActive,
                      ]}
                    >
                      Bueno
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      feedbackStates[rec.product_id] === 'negativo' &&
                        styles.feedbackButtonNegative,
                    ]}
                    onPress={() => handleFeedback(rec.product_id, 'negativo')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        feedbackStates[rec.product_id] === 'negativo'
                          ? 'thumbs-down'
                          : 'thumbs-down-outline'
                      }
                      size={20}
                      color={feedbackStates[rec.product_id] === 'negativo' ? colors.textOnPrimary : colors.error}
                    />
                    <Text
                      style={[
                        styles.feedbackButtonText,
                        feedbackStates[rec.product_id] === 'negativo' &&
                          styles.feedbackButtonTextActive,
                      ]}
                    >
                      Malo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (!session) {
    return null;
  }

  return (
    <Modal visible={visible} animationType='none' transparent={true} onRequestClose={onClose}>
      <Animated.View style={[styles.centeredView, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalView,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name='barbell' size={22} color={colors.primary} />
              <Text style={styles.modalTitle}>Detalles del Entrenamiento</Text>
            </View>
            <View style={styles.headerActions}>
              {onEdit && session ? (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onEdit(session);
                  }}
                  style={styles.iconBtn}
                  accessibilityLabel="Editar entrenamiento"
                >
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole='button'
                accessibilityLabel='Cerrar'
              >
                <Ionicons name='close' size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Session Info Card */}
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={getTypeIcon(session.type)}
                    size={36}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateText}>{formatDate(session.session_date)}</Text>
                  <Text style={styles.typeText}>
                    {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                  </Text>
                  {session.sport_type && (
                    <Text style={styles.sportTypeText}>
                      {session.sport_type.charAt(0).toUpperCase() + session.sport_type.slice(1)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name='clock-outline' size={28} color={colors.primary} />
                <Text style={styles.statValue}>{session.duration_min}</Text>
                <Text style={styles.statLabel}>minutos</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons name='timer-outline' size={28} color={colors.primary} />
                <Text style={styles.statValue}>{formatStartTimeDisplay(session.start_time)}</Text>
                <Text style={styles.statLabel}>inicio</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View
                  style={[
                    styles.intensityIndicator,
                    { backgroundColor: getIntensityColor(session.intensity) },
                  ]}
                />
                <Text style={styles.statValue}>
                  {session.intensity.charAt(0).toUpperCase() + session.intensity.slice(1)}
                </Text>
                <Text style={styles.statLabel}>intensidad</Text>
              </View>

              {session.weather && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name='weather-partly-cloudy'
                      size={28}
                      color={colors.primary}
                    />
                    <Text style={styles.statValue}>
                      {session.weather.charAt(0).toUpperCase() + session.weather.slice(1)}
                    </Text>
                    <Text style={styles.statLabel}>clima</Text>
                  </View>
                </>
              )}
            </View>

            {/* Notes Card */}
            {session.notes && (
              <View style={styles.notesContainer}>
                <View style={styles.notesHeader}>
                  <Ionicons name='document-text' size={20} color={colors.primary} />
                  <Text style={styles.notesLabel}>Notas del Entrenamiento</Text>
                </View>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            )}

            {/* Recommendations */}
            {renderRecommendations()}

            {/* Bottom spacing */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlayStrong,
  },
  modalView: {
    width: '100%',
    maxHeight: '95%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },

  // Session Card
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 2,
  },
  typeText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  sportTypeText: {
    color: colors.primaryText,
    fontSize: 13,
    marginTop: 2,
    fontFamily: fontFamily.semibold,
  },

  // Stats Card
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 8,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fontFamily.extrabold,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intensityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },

  // Notes Card
  notesContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  notesLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    marginLeft: 8,
  },
  notesText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },

  // Recommendations
  recommendationsContainer: {
    marginTop: spacing.sm,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  productName: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: '90%',
    height: 150,
  },
  placeholderContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
  },
  placeholderText: {
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  recommendationReason: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
    marginLeft: 8,
    flex: 1,
  },

  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    color: colors.textSecondary,
    fontSize: 15,
  },
  noRecommendations: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noRecommendationsText: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 8,
  },
  noRecommendationsSubtext: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },

  // Guía de Consumo
  consumptionGuide: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consumptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  consumptionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  consumptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  consumptionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  consumptionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: fontFamily.semibold,
  },
  consumptionValue: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Feedback Section
  feedbackSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  feedbackQuestion: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fontFamily.semibold,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  feedbackButtonPositive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  feedbackButtonNegative: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  feedbackButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontFamily: fontFamily.semibold,
  },
  feedbackButtonTextActive: {
    color: colors.textOnPrimary,
  },
});

export default TrainingDetailModal;
