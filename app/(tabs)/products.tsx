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
import { getProductCategories, getProductsByCategory } from '../../src/services/api';
import { getProductImageSource } from '../../src/utils/imageUtils';
import { useRouter } from 'expo-router';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []);

  const handleCategoryChange = async (categoryId: number) => {
    try {
      console.log('Categoría seleccionada:', categoryId);
      setSelectedCategory(categoryId);
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
            <Ionicons name='arrow-forward-circle' size={18} color='#D4AF37' />
            <Text style={styles.viewDetailsText}>Ver producto</Text>
          </View>
        </View>
      </TouchableOpacity>
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
          <ActivityIndicator size='large' color='#D4AF37' />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => `product-${item.product_id}-${index}`}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Ionicons name='apps' size={20} color='#D4AF37' />
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
                        selectedCategory === category.category_id && styles.selectedCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name='cube-outline' size={60} color='#999' style={{ marginBottom: 15 }} />
              <Text style={styles.emptyText}>No hay productos disponibles en esta categoría.</Text>
            </View>
          }
        />
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
    color: '#D4AF37',
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

  // Categories Section
  categoryContainer: {
    backgroundColor: '#252525',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 0,
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
    color: '#D4AF37',
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
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
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
    color: '#D4AF37',
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
    color: '#D4AF37',
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
});

export default ProductListScreen;
