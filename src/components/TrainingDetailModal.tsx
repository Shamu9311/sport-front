import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api, { saveProductFeedback } from '../services/api';
import Toast from 'react-native-toast-message';
import { getProductImageSource } from '../utils/imageUtils';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface TrainingDetailModalProps {
  visible: boolean;
  onClose: () => void;
  session: any;
  userId: number;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'bajo':
      return colors.success;
    case 'medio':
      return colors.warning;
    case 'alto':
      return colors.warning;
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
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
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

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            setRecommendations(response.data);
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
      setRecommendations([]); // Limpiar recomendaciones anteriores
      setLoading(true);
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      const timer = setTimeout(() => {
        fetchRecommendationsWithRetry(session.session_id);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!visible) {
      // Limpiar cuando se cierra el modal
      setRecommendations([]);
      setLoading(false);
    }
  }, [visible, session?.session_id, userId, fetchRecommendationsWithRetry]);

  // Manejar feedback del usuario con animación
  const handleFeedback = async (productId: number, feedback: 'positivo' | 'negativo') => {
    // Actualizar estado inmediatamente para feedback visual
    setFeedbackStates((prev) => ({
      ...prev,
      [productId]: feedback,
    }));

    try {
      await saveProductFeedback(userId, productId, feedback);
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
      Alert.alert('Error', 'No se pudo guardar tu feedback. Intenta de nuevo.');
    }
  };

  const renderRecommendations = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={styles.loadingText}>Buscando recomendaciones...</Text>
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
          <Ionicons name='star' size={24} color={colors.primary} />
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

              <View style={styles.imageContainer}>
                {rec.image_url ? (
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
                ) : (
                  <View style={styles.placeholderContainer}>
                    <MaterialCommunityIcons name='image-off' size={40} color={colors.textMuted} />
                    <Text style={styles.placeholderText}>Imagen no disponible</Text>
                  </View>
                )}
              </View>

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
                        <Text style={styles.consumptionValue}>{rec.consumption_instructions}</Text>
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
                    disabled={feedbackStates[rec.product_id] === 'positivo'}
                  >
                    <Ionicons
                      name={
                        feedbackStates[rec.product_id] === 'positivo'
                          ? 'thumbs-up'
                          : 'thumbs-up-outline'
                      }
                      size={24}
                      color={feedbackStates[rec.product_id] === 'positivo' ? colors.textPrimary : colors.success}
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
                    disabled={feedbackStates[rec.product_id] === 'negativo'}
                  >
                    <Ionicons
                      name={
                        feedbackStates[rec.product_id] === 'negativo'
                          ? 'thumbs-down'
                          : 'thumbs-down-outline'
                      }
                      size={24}
                      color={feedbackStates[rec.product_id] === 'negativo' ? colors.textPrimary : colors.error}
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
              <Ionicons name='barbell' size={28} color={colors.primary} />
              <Text style={styles.modalTitle}>Detalles del Entrenamiento</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close-circle' size={32} color={colors.primary} />
            </TouchableOpacity>
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
    ...StyleSheet.absoluteFillObject,
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
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${colors.primary}26`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: `${colors.primary}4D`,
  },
  dateText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  sportTypeText: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderStrong,
    marginHorizontal: 8,
  },
  statValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intensityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 14,
    marginBottom: 8,
  },

  // Notes Card
  notesContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notesText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },

  // Recommendations
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 12,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  placeholderContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  recommendationReason: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
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
    marginTop: 16,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  consumptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  consumptionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 10,
  },
  consumptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  consumptionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  consumptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  consumptionValue: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Feedback Section
  feedbackSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackQuestion: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.border,
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
    fontWeight: '600',
  },
  feedbackButtonTextActive: {
    color: colors.textPrimary,
  },
});

export default TrainingDetailModal;
