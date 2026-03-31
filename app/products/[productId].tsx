import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getProductDetails,
  getProductNutrition,
  getProductFlavors,
  getProductAttributes,
} from '../../src/services/api';

import { getProductImageSource } from '../../src/utils/imageUtils';
import { useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

const { width } = Dimensions.get('window');

// Define los tipos para tus datos (puedes moverlos a src/types)
interface Product {
  image_url: string;
  /** API normalizada */
  product_name?: string;
  product_description?: string;
  /** Compat. respuestas antiguas */
  name?: string;
  description?: string;
  usage_recommendation: string;
}
interface NutritionInfo {
  serving_size: string;
  energy_kcal: number;
  protein_g: number;
  // Agrega otros campos si getProductNutrition los devuelve
}
interface Flavor {
  flavor_id: string | number; // Ajusta el tipo si es necesario
  name: string;
}
interface Attribute {
  attribute_id: string | number; // Ajusta el tipo si es necesario
  name: string;
  description: string | null; // Permite que sea null
}

const ProductDetailScreen = () => {
  const params = useLocalSearchParams<{ productId: string }>();
  const { productId } = params; // <-- productId será string o undefined

  // Define tus estados como antes, usando los tipos definidos arriba
  const [product, setProduct] = useState<Product | null>(null);
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(null);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error

  useEffect(() => {
    // 6. Asegúrate de que productId existe antes de usarlo
    if (productId) {
      const loadProductData = async () => {
        // 7. Convierte productId a número para usar en la API (si es necesario)
        const numericProductId = parseInt(productId, 10);
        if (isNaN(numericProductId)) {
          console.error('Invalid Product ID:', productId);
          setError('ID de producto inválido.');
          setLoading(false);
          return;
        }

        setLoading(true); // Empieza la carga
        setError(null); // Resetea errores

        try {
          // Carga todo en paralelo para mejorar rendimiento (opcional)
          const [productData, nutritionData, flavorsData, attributesData] = await Promise.all([
            getProductDetails(numericProductId.toString()),
            getProductNutrition(numericProductId.toString()),
            getProductFlavors(numericProductId.toString()),
            getProductAttributes(numericProductId.toString()),
          ]);

          setProduct(productData);
          setNutrition(nutritionData);
          setFlavors(flavorsData);
          setAttributes(attributesData);
        } catch (err: any) {
          console.error('Error loading product details:', err);
          setError(err.message || 'Error al cargar la información del producto.');
        } finally {
          setLoading(false); // Termina la carga (éxito o fallo)
        }
      };
      loadProductData();
    } else {
      console.error('Product ID is missing');
      setError('No se proporcionó ID de producto.');
      setLoading(false);
    }
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.loadingText}>Cargando información del producto...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name='alert-circle' size={60} color={colors.error} style={{ marginBottom: 20 }} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name='cube-outline' size={60} color={colors.textSecondary} style={{ marginBottom: 20 }} />
        <Text style={styles.errorText}>No se encontró información del producto.</Text>
      </View>
    );
  }

  const displayName = product.product_name ?? product.name ?? 'Producto';
  const displayDescription = product.product_description ?? product.description ?? '';

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
          headerBackTitle: 'Volver',
          headerTintColor: colors.primary,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.primary,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <StatusBar style='light' />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.imageContainer}>
        <Image
          source={getProductImageSource(product.image_url)}
          style={styles.productImage}
          resizeMode='contain'
        />
        </View>

        {/* Product Name and Description Card */}
        <View style={styles.card}>
          <Text style={styles.productName}>{displayName}</Text>
          {displayDescription ? (
            <Text style={styles.productDescription}>{displayDescription}</Text>
          ) : (
            <Text style={styles.productDescriptionMuted}>Sin descripción disponible.</Text>
          )}
        </View>

        {/* Usage Recommendation Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name='bulb' size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Recomendaciones de Uso</Text>
          </View>
          <Text style={styles.sectionContent}>{product.usage_recommendation}</Text>
        </View>

        {/* Flavors Card */}
        {flavors.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name='color-palette' size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sabores Disponibles</Text>
            </View>
            <View style={styles.flavorContainer}>
              {flavors.map((flavor) => (
                <View key={flavor.flavor_id} style={styles.flavorChip}>
                  <Text style={styles.flavorText}>{flavor.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nutrition Card */}
        {nutrition && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name='nutrition' size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Información Nutricional</Text>
            </View>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Porción</Text>
                <Text style={styles.nutritionValue}>{nutrition.serving_size}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Calorías</Text>
                <Text style={styles.nutritionValue}>{nutrition.energy_kcal} kcal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Proteína</Text>
                <Text style={styles.nutritionValue}>{nutrition.protein_g}g</Text>
            </View>
            </View>
          </View>
        )}

        {/* Benefits and Attributes Card */}
        {attributes.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name='checkmark-circle' size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Beneficios y Características</Text>
            </View>
            {attributes.map((attr, index) =>
              attr.description ? (
                <View key={`attr-${attr.attribute_id}-${index}`} style={styles.attributeItem}>
                  <View style={styles.attributeHeader}>
                    <Ionicons name='star' size={16} color={colors.primary} />
                  <Text style={styles.attributeName}>{attr.name}</Text>
                  </View>
                  <Text style={styles.attributeDescription}>{attr.description}</Text>
                </View>
              ) : (
                <View key={`attr-${attr.attribute_id}-${index}`} style={styles.attributeItem}>
                  <View style={styles.attributeHeader}>
                    <Ionicons name='star' size={16} color={colors.primary} />
                    <Text style={styles.attributeName}>{attr.name}</Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  imageContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  productImage: {
    width: width * 0.8,
    height: 280,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productName: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  productDescription: {
    color: colors.textPrimary,
    opacity: 0.92,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  productDescriptionMuted: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  sectionContent: {
    color: colors.textPrimary,
    opacity: 0.92,
    fontSize: 15,
    lineHeight: 24,
  },
  flavorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  flavorChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
    marginBottom: 8,
  },
  flavorText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    borderRadius: 12,
    minWidth: '28%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nutritionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nutritionValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  attributeItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  attributeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attributeName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  attributeDescription: {
    color: colors.textPrimary,
    opacity: 0.88,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 24,
  },
});

export default ProductDetailScreen;
