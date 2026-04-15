// Sport/app/(tabs)/recommendations.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProductImageSource } from '../../src/utils/imageUtils';
import { colors } from '../../src/theme';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import { useSavedRecommendationsData } from '../../src/hooks/useSavedRecommendationsData';

const { width } = Dimensions.get('window');

const RecommendationScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    recommendations,
    negativeRecommendations,
    loading,
    error,
    refreshing,
    fetchRecommendations,
    onRefresh,
  } = useSavedRecommendationsData();
  const [activeTab, setActiveTab] = useState<'positivas' | 'negativas'>('positivas');

  useFocusEffect(
    useCallback(() => {
      fetchRecommendations();
      return () => {};
    }, [fetchRecommendations])
  );

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
                <Ionicons name='arrow-forward-circle' size={18} color={colors.primary} />
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
            <Ionicons name='person-add' size={20} color={colors.textOnPrimary} />
            <Text style={styles.actionButtonText}>Completar mi Perfil</Text>
          </TouchableOpacity>
        );
      }
      return (
        <View style={styles.centeredMessageContainer}>
          <Ionicons name='alert-circle' size={60} color={colors.error} style={styles.emptyIcon} />
          <Text style={styles.errorText}>{error}</Text>
          {actionButton}
        </View>
      );
    }
    if (!loading && recommendations.length === 0 && negativeRecommendations.length === 0) {
      return (
        <View style={styles.centeredMessageContainer}>
          <Ionicons name='barbell-outline' size={80} color={colors.primary} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            Las recomendaciones se generan automáticamente cuando registras una sesión de entrenamiento.
            {'\n\n'}Ve a la pestaña Entrenamiento para comenzar.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/training')}
          >
            <Ionicons name='fitness' size={20} color={colors.textOnPrimary} />
            <Text style={styles.actionButtonText}>Ir a Entrenamiento</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const currentRecommendations =
    activeTab === 'positivas' ? recommendations : negativeRecommendations;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 12, 52) }]}>
        <Text style={styles.title}>Tus Recomendaciones</Text>
        <Text style={styles.subtitle}>Productos personalizados según tu perfil</Text>
        <Text style={styles.pullHint}>Desliza hacia abajo para actualizar</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'positivas' && styles.tabActive]}
          onPress={() => setActiveTab('positivas')}
          activeOpacity={0.7}
        >
          <Ionicons
            name='checkmark-circle'
            size={20}
            color={activeTab === 'positivas' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'positivas' && styles.tabTextActive]}>
            Que me sirvieron ({recommendations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'negativas' && styles.tabActive]}
          onPress={() => setActiveTab('negativas')}
          activeOpacity={0.7}
        >
          <Ionicons
            name='close-circle'
            size={20}
            color={activeTab === 'negativas' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'negativas' && styles.tabTextActive]}>
            No me sirvieron ({negativeRecommendations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <SkeletonLoader type='recommendationList' />
        </View>
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
                    color={colors.primary}
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
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={colors.background}
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
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  pullHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    elevation: 3,
    shadowColor: colors.shadow,
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
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  itemContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.borderStrong,
  },
  infoContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.primary,
  },
  productDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    opacity: 0.88,
    marginBottom: 12,
    lineHeight: 20,
  },
  reasoningContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasoningText: {
    fontSize: 14,
    color: colors.textPrimary,
    opacity: 0.9,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewDetailsText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RecommendationScreen;
