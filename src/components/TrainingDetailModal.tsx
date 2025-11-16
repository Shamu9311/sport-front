import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api, { saveProductFeedback } from '../services/api';
import { getProductImageSource } from '../utils/imageUtils';

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
      return '#4CAF50'; // Verde
    case 'medio':
      return '#FFC107'; // Amarillo
    case 'alto':
      return '#FF9800'; // Naranja
    case 'muy alto':
      return '#F44336'; // Rojo
    default:
      return '#9E9E9E'; // Gris
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

  useEffect(() => {
    console.log('TrainingDetailModal - Props:', { visible, session, userId });
    if (visible && session) {
      console.log('Fetching recommendations...');
      fetchRecommendations();
    }
  }, [visible, session, userId]);

  // Manejar feedback del usuario
  const handleFeedback = async (productId: number, feedback: 'positivo' | 'negativo') => {
    try {
      await saveProductFeedback(userId, productId, feedback);

      // Actualizar estado local
      setFeedbackStates((prev) => ({
        ...prev,
        [productId]: feedback,
      }));

      Alert.alert(
        'Gracias por tu feedback',
        feedback === 'positivo'
          ? '✅ Seguiremos recomendando productos similares'
          : '👎 No volveremos a recomendar este producto',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving feedback:', error);
      Alert.alert('Error', 'No se pudo guardar tu feedback. Intenta de nuevo.');
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      console.log(
        'Obteniendo recomendaciones para sesión:',
        session.session_id,
        'usuario:',
        userId
      );

      // Usamos la instancia de api que ya tiene configurada la URL base
      const response = await api.get(`/training/${session.session_id}/recommendations`, {
        params: { userId },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data && Array.isArray(response.data)) {
        console.log(`Se recibieron ${response.data.length} recomendaciones`);
        setRecommendations(response.data);
      } else {
        console.warn('La respuesta no contiene un array de recomendaciones:', response.data);
        setRecommendations([]);
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      Alert.alert(
        'Error',
        'No se pudieron cargar las recomendaciones. Por favor, inténtalo de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendations = () => {
    console.log('Rendering recommendations:', recommendations);

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#D4AF37' />
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
            color='#666'
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
          <Ionicons name='star' size={24} color='#D4AF37' />
          <Text style={styles.sectionTitle}>Productos Recomendados</Text>
        </View>
        {recommendations.map((rec, recIndex) => {
          console.log('Rendering recommendation:', rec);

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
                return '#4CAF50';
              case 'durante':
                return '#FFC107';
              case 'despues':
                return '#2196F3';
              case 'diario':
                return '#9C27B0';
              default:
                return '#D4AF37';
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
                    onError={(e) => {
                      console.log('Error loading image:', e.nativeEvent?.error);
                      console.log('Image URL that failed:', rec.image_url);
                    }}
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <MaterialCommunityIcons name='image-off' size={40} color='#666' />
                    <Text style={styles.placeholderText}>Imagen no disponible</Text>
                  </View>
                )}
              </View>

              {rec.feedback && (
                <View style={styles.reasoningBox}>
                  <Ionicons name='bulb' size={16} color='#D4AF37' />
                  <Text style={styles.recommendationReason}>{rec.feedback}</Text>
                </View>
              )}

              {/* Guía de Consumo */}
              {(rec.consumption_timing ||
                rec.recommended_quantity ||
                rec.consumption_instructions) && (
                <View style={styles.consumptionGuide}>
                  <View style={styles.consumptionHeader}>
                    <Ionicons name='nutrition' size={20} color='#D4AF37' />
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
                      <Ionicons name='flask' size={18} color='#D4AF37' />
                      <View style={styles.consumptionTextContainer}>
                        <Text style={styles.consumptionLabel}>Cantidad</Text>
                        <Text style={styles.consumptionValue}>{rec.recommended_quantity}</Text>
                      </View>
                    </View>
                  )}

                  {/* Instrucciones */}
                  {rec.consumption_instructions && (
                    <View style={styles.consumptionItem}>
                      <Ionicons name='information-circle' size={18} color='#D4AF37' />
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
                  >
                    <Ionicons
                      name={
                        feedbackStates[rec.product_id] === 'positivo'
                          ? 'thumbs-up'
                          : 'thumbs-up-outline'
                      }
                      size={24}
                      color={feedbackStates[rec.product_id] === 'positivo' ? '#fff' : '#4CAF50'}
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
                  >
                    <Ionicons
                      name={
                        feedbackStates[rec.product_id] === 'negativo'
                          ? 'thumbs-down'
                          : 'thumbs-down-outline'
                      }
                      size={24}
                      color={feedbackStates[rec.product_id] === 'negativo' ? '#fff' : '#FF6B6B'}
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
    <Modal visible={visible} animationType='slide' transparent={true} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name='barbell' size={28} color='#D4AF37' />
              <Text style={styles.modalTitle}>Detalles del Entrenamiento</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close-circle' size={32} color='#D4AF37' />
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
                    color='#D4AF37'
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
                <MaterialCommunityIcons name='clock-outline' size={28} color='#D4AF37' />
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
                      color='#D4AF37'
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
                  <Ionicons name='document-text' size={20} color='#D4AF37' />
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    width: '100%',
    maxHeight: '95%',
    backgroundColor: '#1a1919',
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
    backgroundColor: '#252525',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    color: '#D4AF37',
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
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
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
    backgroundColor: 'rgba(248, 217, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(248, 217, 48, 0.3)',
  },
  dateText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeText: {
    color: '#ddd',
    fontSize: 16,
  },
  sportTypeText: {
    color: '#D4AF37',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
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
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  statValue: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
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
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesLabel: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notesText: {
    color: '#ddd',
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
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginLeft: 12,
  },
  recommendationCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#1f1f1f',
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
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
  },
  placeholderText: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#ddd',
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
    color: '#999',
    fontSize: 15,
  },
  noRecommendations: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  noRecommendationsText: {
    color: '#ddd',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 8,
  },
  noRecommendationsSubtext: {
    color: '#999',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },

  // Guía de Consumo
  consumptionGuide: {
    marginTop: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  consumptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  consumptionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginLeft: 10,
  },
  consumptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  consumptionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  consumptionLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  consumptionValue: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },

  // Feedback Section
  feedbackSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  feedbackQuestion: {
    fontSize: 15,
    color: '#ddd',
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
    backgroundColor: '#1f1f1f',
    borderWidth: 2,
    borderColor: '#333',
  },
  feedbackButtonPositive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  feedbackButtonNegative: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  feedbackButtonText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
    fontWeight: '600',
  },
  feedbackButtonTextActive: {
    color: '#fff',
  },
});

export default TrainingDetailModal;
