import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getProductCategories,
  getProductsByCategory,
  getRecommendations,
  getSavedRecommendations,
} from '../../src/services/api';
import { getProductImageSource } from '../../src/utils/imageUtils';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

interface Product {
  product_id: number;
  name?: string; // Opcional para compatibilidad con datos antiguos
  product_name: string;
  description?: string; // Opcional para compatibilidad con datos antiguos
  product_description: string;
  image_url: string;
  price?: number;
  category_id?: number;
  category_name?: string;
  // Otros campos que vienen del servidor
  feedback?: string;
  feedback_notes?: string;
  recommendation_id?: number;
  recommended_at?: string;
  session_id?: string | null;
  type_name?: string;
  user_id?: number;
}

interface Category {
  category_id: number;
  name: string;
  // otros campos necesarios...
}

const ProductListScreen = () => {
  const { user, hasProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]); // Añadir tipo
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([]); // Productos personalizados
  const [categories, setCategories] = useState<Category[]>([]); // Añadir tipo
  const router = useRouter(); // <-- USA useRouter
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const [showingPersonalized, setShowingPersonalized] = useState(false);

  // Cargar datos iniciales: categorías y productos
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const categoriesResponse = await getProductCategories();
        setCategories(categoriesResponse);

        if (categoriesResponse && categoriesResponse.length > 0) {
          const firstCategory = categoriesResponse[0];
          const productsResponse = await getProductsByCategory(
            firstCategory.category_id.toString()
          );
          setProducts(productsResponse);
          setSelectedCategory(firstCategory.category_id);

          // Si el usuario tiene perfil, carga también sus recomendaciones personalizadas
          if (user && user.id && hasProfile) {
            setLoadingPersonalized(true);
            await fetchPersonalizedRecommendations(user.id);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    // Función separada para obtener recomendaciones personalizadas
    const fetchPersonalizedRecommendations = async (userId: number) => {
      try {
        // Primero verificamos si ya existen recomendaciones guardadas para este usuario
        console.log(`Verificando recomendaciones existentes para usuario ${userId}...`);

        // Intentamos obtener recomendaciones guardadas primero
        try {
          const savedRecommendations = await getSavedRecommendations(userId);

          // Si hay recomendaciones guardadas, las usamos en lugar de generar nuevas
          if (
            savedRecommendations &&
            Array.isArray(savedRecommendations) &&
            savedRecommendations.length > 0
          ) {
            console.log(
              'Usando recomendaciones guardadas existentes:',
              savedRecommendations.length
            );
            setPersonalizedProducts(savedRecommendations);
            setShowingPersonalized(true);
            setLoadingPersonalized(false);
            return; // Terminamos aquí, no necesitamos generar nuevas recomendaciones
          }
          console.log('No se encontraron recomendaciones guardadas, generando nuevas...');
        } catch (savedError) {
          console.log(
            'Error al verificar recomendaciones guardadas, continuando con nuevas:',
            savedError
          );
        }

        // Si no hay recomendaciones guardadas, generamos nuevas
        console.log(`Solicitando nuevas recomendaciones para usuario ${userId}...`);
        const recommendationsResponse = await getRecommendations(userId);

        // Verificar si la respuesta es válida
        if (
          recommendationsResponse &&
          Array.isArray(recommendationsResponse) &&
          recommendationsResponse.length > 0
        ) {
          console.log('Recomendaciones recibidas correctamente:', recommendationsResponse.length);
          setPersonalizedProducts(recommendationsResponse);
          setShowingPersonalized(true);
        } else {
          console.log(
            'No hay recomendaciones disponibles o formato incorrecto:',
            recommendationsResponse
          );
          setShowingPersonalized(false);
        }
      } catch (recError: any) {
        console.error('Error cargando recomendaciones personalizadas:', recError);
        // Mostrar mensaje de error pero no interrumpir la experiencia
        if (recError.status === 404) {
          console.log('El perfil del usuario no existe o no se encontraron recomendaciones');
        } else {
          console.log(
            'Error en la API de recomendaciones:',
            recError.message || 'Error desconocido'
          );
        }
        setShowingPersonalized(false);
      } finally {
        setLoadingPersonalized(false);
      }
    };

    fetchProductData();
  }, [user, hasProfile]);

  const handleCategoryChange = async (categoryId: number) => {
    try {
      console.log('Categoría seleccionada:', categoryId);
      setSelectedCategory(categoryId);
      setShowingPersonalized(false); // Cambiar a vista por categorías
      setLoading(true);

      console.log('Solicitando productos para categoría:', categoryId);
      const productsResponse = await getProductsByCategory(categoryId.toString());

      console.log('Respuesta de la API:', productsResponse);
      console.log('Número de productos recibidos:', productsResponse?.length || 0);

      if (productsResponse && Array.isArray(productsResponse)) {
        console.log('Productos recibidos:', productsResponse);
        setProducts(productsResponse);
      } else {
        console.warn('La respuesta no es un array de productos:', productsResponse);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para alternar entre mostrar productos personalizados y por categoría
  const togglePersonalizedView = () => {
    console.log('Cambiando a vista:', showingPersonalized ? 'Categorías' : 'Personalizada');
    setShowingPersonalized(!showingPersonalized);
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    console.log('Renderizando producto:', item);
    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => router.push(`/products/${item.product_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={getProductImageSource(item.image_url)}
            style={styles.productImage}
            resizeMode='contain'
          />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name || item.name || 'Sin nombre'}
          </Text>
          <Text style={styles.productDescription} numberOfLines={3}>
            {item.product_description || item.description || 'Sin descripción'}
          </Text>
          <View style={styles.productFooter}>
            <Ionicons name='arrow-forward-circle' size={18} color='#F8D930' />
            <Text style={styles.viewDetailsText}>Ver producto</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSwitchButton = () => {
    // Mostrar botón sólo si el usuario tiene perfil Y tenemos recomendaciones personalizadas
    if (!hasProfile || !personalizedProducts || personalizedProducts.length === 0) {
      return null;
    }

    return (
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchButton, showingPersonalized && styles.switchButtonActive]}
          onPress={() => setShowingPersonalized(true)}
        >
          <Ionicons name='star' size={20} color={showingPersonalized ? '#1a1919' : '#999'} />
          <Text
            style={[styles.switchButtonText, showingPersonalized && styles.switchButtonTextActive]}
          >
            Para Ti
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, !showingPersonalized && styles.switchButtonActive]}
          onPress={() => setShowingPersonalized(false)}
        >
          <Ionicons name='grid' size={20} color={!showingPersonalized ? '#1a1919' : '#999'} />
          <Text
            style={[styles.switchButtonText, !showingPersonalized && styles.switchButtonTextActive]}
          >
            Categorías
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header de la página */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Productos</Text>
        <Text style={styles.pageSubtitle}>Encuentra los mejores suplementos</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#F8D930' />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <>
          {renderSwitchButton()}

          {/* Mostrar indicador de carga mientras se cargan las recomendaciones personalizadas */}
          {loadingPersonalized && (
            <View style={styles.personalizedLoadingContainer}>
              <ActivityIndicator size='small' color='#F8D930' />
              <Text style={styles.loadingPersonalizedText}>Cargando recomendaciones...</Text>
            </View>
          )}

          <FlatList
            data={showingPersonalized ? personalizedProducts : products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.product_id.toString()}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              !showingPersonalized ? (
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryHeader}>
                    <Ionicons name='apps' size={20} color='#F8D930' />
                    <Text style={styles.categoryTitle}>Categorías</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScrollContainer}
                  >
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.category_id}
                        style={[
                          styles.categoryButton,
                          selectedCategory === category.category_id && styles.selectedCategory,
                        ]}
                        onPress={() => handleCategoryChange(category.category_id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            selectedCategory === category.category_id &&
                              styles.selectedCategoryText,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.personalizedHeader}>
                  <Ionicons name='star' size={28} color='#F8D930' style={{ marginBottom: 10 }} />
                  <Text style={styles.personalizedTitle}>Recomendado para ti</Text>
                  <Text style={styles.personalizedSubtitle}>
                    Productos seleccionados según tu perfil
                  </Text>
                </View>
              )
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={showingPersonalized ? 'star-outline' : 'cube-outline'}
                  size={60}
                  color='#999'
                  style={{ marginBottom: 15 }}
                />
                <Text style={styles.emptyText}>
                  {showingPersonalized
                    ? 'No tenemos recomendaciones disponibles aún.'
                    : 'No hay productos disponibles en esta categoría.'}
                </Text>
                {showingPersonalized && (
                  <Text style={styles.emptySubtext}>
                    ¡Completa tu perfil para recibir sugerencias personalizadas!
                  </Text>
                )}
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1919',
  },

  // Page Header
  pageHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1a1919',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8D930',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#999',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 15,
  },
  personalizedLoadingContainer: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  loadingPersonalizedText: {
    color: '#F8D930',
    fontSize: 14,
    marginLeft: 10,
  },

  // Switch Toggle Buttons
  switchContainer: {
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
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  switchButtonActive: {
    backgroundColor: '#F8D930',
  },
  switchButtonText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchButtonTextActive: {
    color: '#1a1919',
    fontWeight: 'bold',
  },

  // Categories Section
  categoryContainer: {
    backgroundColor: '#252525',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    color: '#F8D930',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  categoryScrollContainer: {
    paddingHorizontal: 4,
    paddingBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 110,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#F8D930',
    borderColor: '#F8D930',
  },
  categoryText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#1a1919',
    fontWeight: 'bold',
  },

  // Personalized Header
  personalizedHeader: {
    backgroundColor: '#252525',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8D930',
    elevation: 5,
    shadowColor: '#F8D930',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  personalizedTitle: {
    color: '#F8D930',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  personalizedSubtitle: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
  },

  // Product List
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  productImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  productName: {
    color: '#F8D930',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  productDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  viewDetailsText: {
    color: '#F8D930',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyText: {
    color: '#ddd',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ProductListScreen;
