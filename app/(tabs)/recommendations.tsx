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
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProductImageSource } from '../../src/utils/imageUtils';
import { colors, fontFamily, radius, shadows, spacing } from '../../src/theme';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import ProductImageFrame from '../../src/components/ui/ProductImageFrame';
import { useSavedRecommendationsData } from '../../src/hooks/useSavedRecommendationsData';
import { hapticSelection } from '../../src/utils/haptics';
import { SavedRecommendation } from '../../src/types/UserTypes';

interface ProductDetails {
  product_id: number;
  name?: string;
  product_name?: string;
  description?: string;
  product_description?: string;
  image_url?: string;
}

const STRATEGY_INTRO_PATTERN =
  /^la estrategia de suplementaci[oó]n\s+(?:se centra en|se ha diseñado para|se enfoca en)\s+/i;

const stripStrategyIntro = (text: string): string => {
  let cleaned = text.trim();

  if (cleaned.includes(' | ')) {
    const [productPart, generalPart] = cleaned.split(' | ', 2);
    cleaned = (productPart.trim() || generalPart.trim()).trim();
  }

  cleaned = cleaned.replace(STRATEGY_INTRO_PATTERN, '').trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
};

const getDisplayReasoning = (text: string): string => {
  const cleaned = stripStrategyIntro(text);
  return cleaned || text.trim();
};

const RecommendationScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    recommendations,
    negativeRecommendations,
    pendingRecommendations,
    loading,
    error,
    refreshing,
    fetchRecommendations,
    onRefresh,
  } = useSavedRecommendationsData();
  const [activeTab, setActiveTab] = useState<'pendientes' | 'positivas' | 'negativas'>(
    'pendientes'
  );

  useFocusEffect(
    useCallback(() => {
      fetchRecommendations();
      return () => {};
    }, [fetchRecommendations])
  );

  const renderRecommendationItem = ({ item }: { item: SavedRecommendation }) => {
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
        imageUrl = product.image_url || null;
        reasoning = item.reasoning || item.reasoningText || item.feedback_notes || item.feedback;
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
        <Animated.View entering={FadeInDown.duration(250)}>
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => {
            router.push(`/products/${productId}`);
          }}
          activeOpacity={0.85}
          accessibilityRole='button'
          accessibilityLabel={`Ver detalles de ${productName}`}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.productImageContainer}>
              <ProductImageFrame style={styles.productImageFrame}>
                <Image source={imageSource} style={styles.productImage} resizeMode='contain' />
              </ProductImageFrame>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.productName} numberOfLines={2}>
                {productName}
              </Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {productDescription}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.viewDetailsText}>Ver detalles</Text>
                <Ionicons name='chevron-forward' size={14} color={colors.primaryText} />
              </View>
            </View>
          </View>
          {reasoning && (
            <View style={styles.reasoningContainer}>
              <View style={styles.reasoningHeader}>
                <Ionicons name='sparkles' size={13} color={colors.primary} />
                <Text style={styles.reasoningTitle}>Recomendado para ti</Text>
              </View>
              <Text style={styles.reasoningText}>{getDisplayReasoning(reasoning)}</Text>
            </View>
          )}
        </TouchableOpacity>
        </Animated.View>
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
    if (
      !loading &&
      recommendations.length === 0 &&
      negativeRecommendations.length === 0 &&
      pendingRecommendations.length === 0
    ) {
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
    activeTab === 'positivas'
      ? recommendations
      : activeTab === 'negativas'
        ? negativeRecommendations
        : pendingRecommendations;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 12, 52) }]}>
        <Text style={styles.title}>Tus Recomendaciones</Text>
        <Text style={styles.subtitle}>Productos personalizados según tu perfil</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pendientes' && styles.tabActive]}
          onPress={() => {
            void hapticSelection();
            setActiveTab('pendientes');
          }}
          activeOpacity={0.7}
          accessibilityRole='tab'
          accessibilityState={{ selected: activeTab === 'pendientes' }}
        >
          <Ionicons
            name='help-circle'
            size={16}
            color={activeTab === 'pendientes' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'pendientes' && styles.tabTextActive]}>
            Por calificar ({pendingRecommendations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'positivas' && styles.tabActive]}
          onPress={() => {
            void hapticSelection();
            setActiveTab('positivas');
          }}
          activeOpacity={0.7}
          accessibilityRole='tab'
          accessibilityState={{ selected: activeTab === 'positivas' }}
        >
          <Ionicons
            name='checkmark-circle'
            size={16}
            color={activeTab === 'positivas' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'positivas' && styles.tabTextActive]}>
            Me sirvieron ({recommendations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'negativas' && styles.tabActive]}
          onPress={() => {
            void hapticSelection();
            setActiveTab('negativas');
          }}
          activeOpacity={0.7}
          accessibilityRole='tab'
          accessibilityState={{ selected: activeTab === 'negativas' }}
        >
          <Ionicons
            name='close-circle'
            size={16}
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
    fontSize: 28,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pullHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    marginLeft: 5,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    ...shadows.card,
  },
  actionButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bold,
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
    marginVertical: 6,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  listContainer: {
    paddingBottom: 20,
    paddingTop: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  productImageContainer: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageFrame: {
    width: 92,
    height: 92,
  },
  productImage: {
    width: 74,
    height: 74,
  },
  infoContainer: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    paddingLeft: spacing.xs,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 4,
    color: colors.textPrimary,
  },
  productDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  reasoningContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  reasoningTitle: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    color: colors.primaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasoningText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: colors.primaryText,
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    marginRight: 2,
  },
});

export default RecommendationScreen;
