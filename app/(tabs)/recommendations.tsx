// Sport/app/(tabs)/recommendations.tsx
import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../../src/context/AuthContext';
import { getSavedRecommendations, getUserFeedbackHistory } from '../../src/services/api';
import api from '../../src/services/api';
import { getProductImageSource } from '../../src/utils/imageUtils';

const { width } = Dimensions.get('window');

const API_BASE_URL_IMAGES = 'http://192.168.100.35:5000'; // Reemplaza con la URL de tu backend

const RecommendationScreen = () => {
  // No necesita { navigation } como prop con useRouter
  const router = useRouter(); // Hook de Expo Router para navegación
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthContext must be used within an AuthProvider');
  const { userToken } = context;
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [negativeRecommendations, setNegativeRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'positivas' | 'negativas'>('positivas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (isRefresh = false) => {
    if (!userToken) {
      setError('Debes iniciar sesión para obtener recomendaciones.');
      if (!isRefresh) setLoading(false);
      else setRefreshing(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      // Obtener el ID del usuario desde el token usando useAuth
      const { user } = context;
      const userId = user?.id;

      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      console.log('Obteniendo recomendaciones para el usuario:', userId);

      // Obtener recomendaciones guardadas
      const savedRecommendations = await getSavedRecommendations(userId);

      // Obtener feedback del usuario
      const feedbackResponse = await getUserFeedbackHistory(userId);
      const feedbackMap: { [key: number]: string } = {};

      if (feedbackResponse.success && feedbackResponse.feedback) {
        feedbackResponse.feedback.forEach((f: any) => {
          feedbackMap[f.product_id] = f.feedback;
        });
      }

      if (
        savedRecommendations &&
        Array.isArray(savedRecommendations) &&
        savedRecommendations.length > 0
      ) {
        // Separar por feedback positivo y negativo
        const positiveRecs: any[] = [];
        const negativeRecs: any[] = [];

        savedRecommendations.forEach((rec: any) => {
          const productId = rec.product_id || rec.product_details?.product_id;
          const feedback = feedbackMap[productId];

          if (feedback === 'negativo') {
            negativeRecs.push(rec);
          } else {
            // Sin feedback o feedback positivo
            positiveRecs.push(rec);
          }
        });

        // Obtener valores únicos por product_name para positivas
        const seenNamesPos = new Set<string>();
        const uniquePositiveRecs = positiveRecs.filter((rec: any) => {
          const productName =
            rec.product_details?.name ||
            rec.product_details?.product_name ||
            rec.name ||
            rec.product_name ||
            '';

          if (!productName || seenNamesPos.has(productName)) {
            return false;
          }

          seenNamesPos.add(productName);
          return true;
        });

        // Obtener valores únicos por product_name para negativas
        const seenNamesNeg = new Set<string>();
        const uniqueNegativeRecs = negativeRecs.filter((rec: any) => {
          const productName =
            rec.product_details?.name ||
            rec.product_details?.product_name ||
            rec.name ||
            rec.product_name ||
            '';

          if (!productName || seenNamesNeg.has(productName)) {
            return false;
          }

          seenNamesNeg.add(productName);
          return true;
        });

        setRecommendations(uniquePositiveRecs);
        setNegativeRecommendations(uniqueNegativeRecs);
      } else {
        console.log('No se encontraron recomendaciones guardadas');
        setError(
          'No hay recomendaciones disponibles. Visita la sección de productos para generar recomendaciones personalizadas.'
        );
        setRecommendations([]);
        setNegativeRecommendations([]);
      }
    } catch (err: any) {
      let errorMessage = 'Error al obtener recomendaciones. Intenta más tarde.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('Error obteniendo recomendaciones:', err);
      setError(errorMessage);
      setRecommendations([]);
    } finally {
      if (!isRefresh) setLoading(false);
      else setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Cargar recomendaciones guardadas cuando se enfoca la pantalla
      fetchRecommendations();
      return () => {};
    }, [userToken])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations(true);
  }, [userToken]);

  interface ProductDetails {
    product_id: number;
    name?: string;
    product_name?: string;
    description?: string;
    product_description?: string;
    image_url?: string;
    [key: string]: any; // Allow any other properties
  }

  interface RecommendationItem {
    product_details?: ProductDetails;
    product_id?: number;
    name?: string;
    product_name?: string;
    description?: string;
    product_description?: string;
    image_url?: string;
    reasoning?: string;
    reasoningText?: string;
    feedback?: string;
    feedback_notes?: string;
    [key: string]: any; // Allow any other properties
  }

  const renderRecommendationItem = ({ item }: { item: any }) => {
    // Verificar que el item no sea null o undefined
    if (!item) {
      console.error('Item de recomendación es null o undefined');
      return null;
    }

    console.log('Estructura del item de recomendación:', JSON.stringify(item));

    // Inicializar variables con valores por defecto
    let product: ProductDetails = {} as ProductDetails;
    let productId: number | null = null;
    let productName: string = 'Producto';
    let productDescription: string = 'Sin descripción disponible';
    let imageUrl: string | null = null;
    let reasoning: string | null = null;

    try {
      // Intentar extraer datos según diferentes estructuras posibles
      if (item.product_details && typeof item.product_details === 'object') {
        // Formato esperado con product_details
        product = item.product_details;
        productId = product.product_id;
        productName = product.name || product.product_name || 'Producto';
        productDescription =
          product.description || product.product_description || 'Sin descripción';
        reasoning = item.reasoning || item.reasoningText || item.feedback || item.feedback_notes;
      } else if (item.product_id) {
        // Formato alternativo donde el item mismo contiene los datos del producto
        product = item;
        productId = item.product_id;
        productName = item.name || item.product_name || `Producto ${productId}`;
        productDescription = item.description || item.product_description || 'Sin descripción';
        imageUrl = item.image_url;
        reasoning = item.reasoning || item.reasoningText || item.feedback || item.feedback_notes;
      } else {
        console.error('Formato de recomendación no reconocido:', item);
        return null;
      }

      // Verificar que tenemos un ID de producto
      if (!productId) {
        console.error('ID de producto no encontrado en:', item);
        return null;
      }

      // Usar la función getProductImageSource para manejar las imágenes de forma consistente
      const imageSource = getProductImageSource(imageUrl);

      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => {
            console.log('Navegar a detalles de producto ID:', productId);
            router.push(`/products/${productId}`);
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.productImageContainer}>
              <Image source={imageSource} style={styles.productImage} resizeMode='contain' />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.productName} numberOfLines={2}>
                {productName}
              </Text>
              <Text style={styles.productDescription} numberOfLines={3}>
                {productDescription}
              </Text>
              {reasoning && (
                <View style={styles.reasoningContainer}>
                  <Text style={styles.reasoningTitle}>💡 Recomendado para ti</Text>
                  <Text style={styles.reasoningText} numberOfLines={3}>
                    {reasoning}
                  </Text>
                </View>
              )}
              <View style={styles.cardFooter}>
                <Ionicons name='arrow-forward-circle' size={18} color='#D4AF37' />
                <Text style={styles.viewDetailsText}>Ver detalles</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error al renderizar recomendación:', error);
      return null;
    }
  };

  const renderEmptyOrErrorState = () => {
    if (error) {
      let actionButton = null;
      if (error.toLowerCase().includes('perfil')) {
        actionButton = (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name='person-add' size={20} color='#1a1919' />
            <Text style={styles.actionButtonText}>Completar mi Perfil</Text>
          </TouchableOpacity>
        );
      }
      return (
        <View style={styles.centeredMessageContainer}>
          <Ionicons name='alert-circle' size={60} color='#FF6B6B' style={styles.emptyIcon} />
          <Text style={styles.errorText}>{error}</Text>
          {actionButton}
        </View>
      );
    }
    if (!loading && recommendations.length === 0) {
      return (
        <View style={styles.centeredMessageContainer}>
          <Ionicons name='rocket-outline' size={80} color='#D4AF37' style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            Aún no hay recomendaciones para ti.
            {'\n\n'}Presiona el botón Actualizar o desliza hacia abajo para generar recomendaciones
            personalizadas.
          </Text>
        </View>
      );
    }
    return null;
  };

  const currentRecommendations =
    activeTab === 'positivas' ? recommendations : negativeRecommendations;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Tus Recomendaciones</Text>
        <Text style={styles.subtitle}>Productos personalizados según tu perfil</Text>
        <Text style={styles.pullHint}>Desliza hacia abajo para actualizar</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'positivas' && styles.tabActive]}
          onPress={() => setActiveTab('positivas')}
        >
          <Ionicons
            name='checkmark-circle'
            size={20}
            color={activeTab === 'positivas' ? '#1a1919' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'positivas' && styles.tabTextActive]}>
            Que me sirvieron ({recommendations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'negativas' && styles.tabActive]}
          onPress={() => setActiveTab('negativas')}
        >
          <Ionicons
            name='close-circle'
            size={20}
            color={activeTab === 'negativas' ? '#1a1919' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'negativas' && styles.tabTextActive]}>
            No me sirvieron ({negativeRecommendations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && (
        <ActivityIndicator size='large' color='#D4AF37' style={styles.loader} />
      )}

      {!loading && (currentRecommendations.length > 0 || error) ? (
        <FlatList
          data={currentRecommendations}
          renderItem={renderRecommendationItem}
          keyExtractor={(item, index) => {
            // Safely extract the product_id regardless of the data structure
            if (item.recommendation_id) {
              return `rec-${item.recommendation_id}`;
            } else if (item.product_details && item.product_details.product_id) {
              return `prod-${item.product_details.product_id}-${index}`;
            } else if (item.product_id) {
              return `prod-${item.product_id}-${index}`;
            }
            // Fallback usando el índice del array
            return `item-${index}`;
          }}
          ListEmptyComponent={() => {
            if (activeTab === 'negativas' && negativeRecommendations.length === 0) {
              return (
                <View style={styles.centeredMessageContainer}>
                  <Ionicons
                    name='checkmark-circle-outline'
                    size={80}
                    color='#D4AF37'
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyText}>No tienes productos marcados como no útiles.</Text>
                </View>
              );
            }
            return renderEmptyOrErrorState();
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#D4AF37']}
              tintColor='#D4AF37'
              progressBackgroundColor='#1a1919'
            />
          }
        />
      ) : (
        !loading && renderEmptyOrErrorState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1919',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a1919',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  pullHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    // textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#D4AF37',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#1a1919',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#1a1919',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  loader: {
    marginTop: 100,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    lineHeight: 24,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#252525',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  listContainer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  productImageContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  infoContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#D4AF37',
  },
  productDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 20,
  },
  reasoningContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasoningText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  viewDetailsText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RecommendationScreen;
