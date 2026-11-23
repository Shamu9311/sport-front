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
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

// El Modal crea una nueva raíz nativa: necesita su propio SafeAreaProvider. Con métricas iniciales
// se pinta desde el primer frame (y funciona en tests, donde no hay medición nativa).
const SAFE_AREA_METRICS = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
import api, { getUserFeedbackHistory, saveProductFeedback, unwrapApiPayload } from '../services/api';
import Toast from 'react-native-toast-message';
import { getProductImageSource } from '../utils/imageUtils';
import { colors, fontFamily, radius, shadows, spacing } from '../theme';
import LoadingState from './ui/LoadingState';
import ProductImageFrame from './ui/ProductImageFrame';
import { hapticSuccess } from '../utils/haptics';
import {
  displayLabel,
  formatConsumptionWhen,
  formatStartTimeDisplay,
  hasSessionEnded,
  weatherLabel,
} from '../utils/format';
import { notify } from '../services/feedback';
import { roleLabel, sessionCaffeineText, slotLabel, targetText, usagePlanLines } from '../utils/recommendationSlots';
import { RecommendationEvidence, SavedRecommendation, TrainingSession } from '../types/UserTypes';
import {
  parseIntervalMinutesFromInstructions,
  stripIntervalPrefixFromInstructions,
} from '../services/notificationService';

const SEARCHING_MESSAGES = [
  'Analizando tu entrenamiento...',
  'Buscando productos adecuados...',
  'Generando recomendaciones personalizadas...',
];

/** Tarjetas de carga genéricas: el número de recomendaciones es variable (no siempre 4 fases). */
const SKELETON_CARDS = 2;

const SOURCE_TYPE_LABELS: Record<string, string> = {
  meta_analysis: 'Metaanálisis',
  systematic_review: 'Revisión sistemática',
  randomized_controlled_trial: 'Ensayo controlado aleatorizado',
  crossover_trial: 'Ensayo cruzado',
  non_randomized_trial: 'Ensayo no aleatorizado',
  observational_study: 'Estudio observacional',
  narrative_review: 'Revisión narrativa',
  consensus: 'Consenso',
  position_stand: 'Posicionamiento oficial',
  guideline: 'Guía',
  official_framework: 'Marco oficial',
  manufacturer_specification: 'Ficha del fabricante',
};

const EVIDENCE_ROLE_LABELS: Record<RecommendationEvidence['role'], string> = {
  supports: 'Respalda',
  caveat: 'Matiza',
  usage_constraint: 'Instrucción del fabricante (no es evidencia de eficacia)',
};

/** Agrupa la evidencia por fuente para no repetir el mismo estudio en la tarjeta. */
export function groupEvidenceBySource(evidence: RecommendationEvidence[] = []) {
  const bySource = new Map<number, RecommendationEvidence & { summaries: string[] }>();
  for (const e of evidence) {
    const current = bySource.get(e.source_id);
    if (current) {
      if (e.summary && !current.summaries.includes(e.summary)) current.summaries.push(e.summary);
      if (current.role !== 'supports' && e.role === 'supports') current.role = 'supports';
    } else {
      bySource.set(e.source_id, { ...e, summaries: e.summary ? [e.summary] : [] });
    }
  }
  return [...bySource.values()];
}

const evidenceLink = (e: RecommendationEvidence) => (e.doi ? 'https://doi.org/' + e.doi : e.url || null);

/**
 * Razonamiento del LLM guardado en feedback_notes. Algunas filas guardan "razón del producto | estrategia
 * general"; se muestra solo la parte del producto.
 */
export function getRecommendationReason(rec: Partial<SavedRecommendation> & { feedback_notes?: string | null }) {
  const notes = typeof rec?.feedback_notes === 'string' ? rec.feedback_notes.trim() : '';
  if (!notes) return '';
  return notes.split(' | ')[0].trim();
}

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
  // Evidence RAG: motivo por el que la sesión no tiene recomendaciones respaldadas
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [openAlternatives, setOpenAlternatives] = useState<Record<string, boolean>>({});
  const [feedbackStates, setFeedbackStates] = useState<{ [key: number]: string }>({});
  const sessionEnded = session ? hasSessionEnded(session) : false;

  // Cargar las calificaciones ya guardadas: antes "Bueno/Malo" aparecía sin marcar al reabrir,
  // aunque el feedback estaba guardado en el servidor.
  useEffect(() => {
    if (!visible || !session?.session_id) return;
    let cancelled = false;
    getUserFeedbackHistory()
      .then((res: { feedback?: { product_id: number; feedback: string }[] }) => {
        if (cancelled || !res?.feedback) return;
        const saved: { [key: number]: string } = {};
        res.feedback.forEach((f) => {
          saved[f.product_id] = f.feedback;
        });
        setFeedbackStates(saved);
      })
      .catch(() => {
        /* sin historial: los botones quedan sin marcar */
      });
    return () => {
      cancelled = true;
    };
  }, [visible, session?.session_id]);

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
          const meta = (response.data as { meta?: { recommendation_status?: string } })?.meta;

          if (recommendationList.length > 0) {
            setRecommendations(recommendationList as SavedRecommendation[]);
            setStatusNote(null);
            setLoading(false);
            return;
          }

          // La generación terminó sin recomendaciones respaldadas por evidencia: no seguir reintentando
          if (meta?.recommendation_status === 'none' || meta?.recommendation_status === 'failed') {
            setRecommendations([]);
            setStatusNote(
              meta.recommendation_status === 'none'
                ? 'No hay evidencia suficiente para recomendar productos en esta sesión.'
                : 'No se pudieron generar las recomendaciones. Inténtalo más tarde.'
            );
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
      setStatusNote(null);
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
      // Esqueleto genérico: el número de recomendaciones depende de la evidencia (no siempre 4 fases).
      return (
        <View style={styles.recommendationsContainer} testID="recommendations-skeleton">
          <LoadingState messages={SEARCHING_MESSAGES} style={styles.skeletonLoadingMessage} />
          {Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <View key={'skeleton-' + i} style={styles.skeletonCard} testID="recommendation-skeleton-card">
              <View style={styles.skeletonImage} />
              <View style={[styles.skeletonLine, { width: '70%' }]} />
              <View style={[styles.skeletonLine, { width: '45%' }]} />
            </View>
          ))}
        </View>
      );
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
            {statusNote || 'No hay recomendaciones disponibles en este momento.'}
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
        {sessionCaffeineText(recommendations) ? (
          <Text style={styles.caffeineTotal} testID="session-caffeine-total">
            {sessionCaffeineText(recommendations)}
          </Text>
        ) : null}
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
              {rec.role ? (
                <View style={styles.slotRow} testID="recommendation-slot">
                  <Text style={[styles.slotChip, { color: getTimingColor(rec.consumption_timing || '') }]}>
                    {slotLabel(rec.consumption_timing, rec.role)}
                  </Text>
                  {(rec.also_covers || []).length > 0 ? (
                    <Text style={styles.slotAlso}>
                      {'También cubre: ' + (rec.also_covers || []).map((r) => roleLabel(r, rec.consumption_timing)).join(', ')}
                    </Text>
                  ) : null}
                </View>
              ) : null}
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

              {/* Antes se leía rec.feedback (calificación, normalmente vacía) y nunca se mostraba el porqué */}
              {getRecommendationReason(rec) ? (
                <View style={styles.reasoningBox}>
                  <Ionicons name='bulb' size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reasoningTitle}>Por qué te lo recomendamos</Text>
                    <Text style={styles.recommendationReason}>{getRecommendationReason(rec)}</Text>
                  </View>
                </View>
              ) : null}

              {/* Guía de Consumo */}
              {!!(rec.consumption_timing ||
                rec.recommended_quantity ||
                rec.consumption_instructions ||
                rec.usage_plan) && (
                <View style={styles.consumptionGuide}>
                  <View style={styles.consumptionHeader}>
                    <Ionicons name='nutrition' size={20} color={colors.primary} />
                    <Text style={styles.consumptionTitle}>Cómo Consumir</Text>
                  </View>

                  {/* Cuándo consumir */}
                  {!!rec.consumption_timing && (
                    <View style={styles.consumptionItem}>
                      <Ionicons
                        name={getTimingIcon(rec.consumption_timing)}
                        size={18}
                        color={getTimingColor(rec.consumption_timing)}
                      />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Cuándo</Text>
                        <Text style={styles.consumptionValue}>
                          {formatConsumptionWhen(
                            rec.consumption_timing,
                            rec.timing_minutes,
                            parseIntervalMinutesFromInstructions(rec.consumption_instructions)
                          )}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Cantidad */}
                  {!!rec.recommended_quantity && (
                    <View style={styles.consumptionItem}>
                      <Ionicons name='flask' size={18} color={colors.primary} />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Cantidad</Text>
                        <Text style={styles.consumptionValue}>{rec.recommended_quantity}</Text>
                      </View>
                    </View>
                  )}

                  {/* Objetivo (del claim) y plan calculado por el servidor (Evidence RAG) */}
                  {targetText(rec.target) ? (
                    <View style={styles.consumptionItem}>
                      <Ionicons name='flag-outline' size={18} color={colors.primary} />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Objetivo</Text>
                        <Text style={styles.consumptionValue}>{targetText(rec.target)}</Text>
                      </View>
                    </View>
                  ) : null}
                  {usagePlanLines(rec.usage_plan).length > 0 ? (
                    <View style={styles.consumptionItem} testID="recommendation-usage-plan">
                      <Ionicons name='repeat' size={18} color={colors.primary} />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Plan</Text>
                        {usagePlanLines(rec.usage_plan).map((line, i) => (
                          <Text key={i} style={styles.consumptionValue}>{line}</Text>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Instrucciones */}
                  {!!rec.consumption_instructions && (
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

              {/* Evidencia (Evidence RAG): fuentes revisadas que respaldan o matizan la recomendación */}
              {rec.evidence && rec.evidence.length > 0 ? (
                <View style={styles.evidenceSection} testID="recommendation-evidence">
                  <View style={styles.consumptionHeader}>
                    <Ionicons name='library-outline' size={20} color={colors.primary} />
                    <Text style={styles.consumptionTitle}>Evidencia</Text>
                  </View>
                  {rec.evidence_note ? <Text style={styles.evidenceNote}>{rec.evidence_note}</Text> : null}
                  {groupEvidenceBySource(rec.evidence).map((e) => {
                    const link = evidenceLink(e);
                    return (
                      <View key={'ev-' + e.source_id} style={styles.evidenceItem}>
                        <Text style={styles.evidenceTitle}>
                          {e.title}
                          {e.year ? ' (' + e.year + ')' : ''}
                        </Text>
                        <Text style={styles.evidenceMeta}>
                          {[SOURCE_TYPE_LABELS[e.source_type || ''] || e.source_type, EVIDENCE_ROLE_LABELS[e.role]]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        {e.summaries.slice(0, 2).map((summary, i) => (
                          <Text key={i} style={styles.evidenceSummary} numberOfLines={4}>
                            {summary}
                          </Text>
                        ))}
                        {link ? (
                          <TouchableOpacity onPress={() => Linking.openURL(link).catch(() => {})} accessibilityRole='link'>
                            <Text style={styles.evidenceLink}>{e.doi ? 'DOI: ' + e.doi : link}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Alternativas del mismo hueco: en lugar del principal, no además */}
              {rec.alternatives && rec.alternatives.length > 0 ? (
                <View style={styles.alternativesSection} testID="recommendation-alternatives">
                  <TouchableOpacity
                    style={styles.alternativesToggle}
                    accessibilityRole='button'
                    onPress={() => {
                      const key = String(rec.recommendation_id ?? recIndex);
                      setOpenAlternatives((prev) => ({ ...prev, [key]: !prev[key] }));
                    }}
                  >
                    <Ionicons name='swap-horizontal' size={18} color={colors.primary} />
                    <Text style={styles.alternativesTitle}>
                      {'Alternativas (' + rec.alternatives.length + ') · en lugar de, no además'}
                    </Text>
                    <Ionicons
                      name={openAlternatives[String(rec.recommendation_id ?? recIndex)] ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                  {openAlternatives[String(rec.recommendation_id ?? recIndex)]
                    ? rec.alternatives.map((alt) => (
                        <View key={'alt-' + alt.product_id} style={styles.alternativeItem}>
                          <Text style={styles.alternativeName}>{alt.product_name}</Text>
                          {alt.usage_plan?.text ? <Text style={styles.alternativeText}>{alt.usage_plan.text}</Text> : null}
                          <Text style={styles.alternativeReason}>{'No es la principal: ' + alt.reason}</Text>
                        </View>
                      ))
                    : null}
                </View>
              ) : null}

              {/* Sección de Feedback: solo tiene sentido después de entrenar */}
              {!sessionEnded ? (
                <View style={styles.feedbackPending}>
                  <Ionicons name='time-outline' size={16} color={colors.textMuted} />
                  <Text style={styles.feedbackPendingText}>
                    Podrás calificarlo después de tu entrenamiento.
                  </Text>
                </View>
              ) : (
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
              )}
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
    // Pantalla completa: antes era una hoja inferior que ocupaba ~60 % mientras cargaba y "saltaba"
    // a casi toda la pantalla al llegar las recomendaciones.
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='fullScreen'
      onRequestClose={onClose}
    >
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
          {/* Header: volver a la izquierda y "Editar" (con texto) a la derecha, separados */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.backButton}
              accessibilityRole='button'
              accessibilityLabel='Volver a entrenamientos'
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name='chevron-back' size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              Detalle del entrenamiento
            </Text>
            {onEdit && session ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onEdit(session);
                }}
                style={styles.editButton}
                accessibilityRole='button'
                accessibilityLabel='Editar entrenamiento'
              >
                <Ionicons name='create-outline' size={18} color={colors.primary} />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
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
                    {displayLabel(session.type)}
                  </Text>
                  {!!session.sport_type && (
                    <Text style={styles.sportTypeText}>
                      {displayLabel(session.sport_type)}
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
                  {displayLabel(session.intensity)}
                </Text>
                <Text style={styles.statLabel}>intensidad</Text>
              </View>

              {!!session.weather && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name='weather-partly-cloudy'
                      size={28}
                      color={colors.primary}
                    />
                    <Text style={styles.statValue}>{weatherLabel(session.weather)}</Text>
                    <Text style={styles.statLabel}>clima</Text>
                  </View>
                </>
              )}
            </View>

            {/* Notes Card (!! evita renderizar '' como nodo de texto suelto) */}
            {!!session.notes && (
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
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fontFamily.bold,
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Skeleton de las 4 fases mientras se generan las recomendaciones
  skeletonLoadingMessage: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonImage: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginBottom: 8,
    opacity: 0.5,
  },
  feedbackPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  feedbackPendingText: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
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
  },
  reasoningTitle: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: fontFamily.semibold,
    marginLeft: 8,
    marginBottom: 2,
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

  // Evidencia (Evidence RAG)
  caffeineTotal: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  slotRow: {
    marginBottom: spacing.xs,
  },
  slotChip: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotAlso: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  alternativesSection: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  alternativesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alternativesTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  alternativeItem: {
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alternativeName: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  alternativeText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alternativeReason: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  evidenceSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenceNote: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  evidenceItem: {
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  evidenceTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  evidenceMeta: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  evidenceSummary: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  evidenceLink: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    marginTop: 4,
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
