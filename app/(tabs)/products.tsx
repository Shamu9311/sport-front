import React, { useEffect, useState, useRef } from 'react';
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
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getProductCategories,
  getProductsByCategory,
  searchProducts,
} from '../../src/services/api';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiming, setSelectedTiming] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 20;
  
  // Animaciones para chips
  const chipAnimations = useRef<{ [key: number]: Animated.Value }>({}).current;

  // Cargar datos iniciales: categorías y productos
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const categoriesResponse = await getProductCategories();
        setCategories(categoriesResponse);

        // Cargar productos por defecto (con paginación)
        const result = await searchProducts({
          q: '',
          category: '',
          timing: '',
          type: '',
          limit: pageSize,
          offset: 0,
        });
        setProducts(result.products);
        setProductCount(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(0);
        setSelectedCategory(null); // null = "Todos"
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await searchProducts({
        q: searchQuery,
        category: selectedCategory !== null ? selectedCategory.toString() : '',
        timing: selectedTiming,
        limit: pageSize,
        offset: 0,
      });
      setProducts(result.products);
      setProductCount(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryChange = async (categoryId: number) => {
    // Animación del chip
    if (!chipAnimations[categoryId]) {
      chipAnimations[categoryId] = new Animated.Value(1);
    }
    Animated.sequence([
      Animated.timing(chipAnimations[categoryId], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(chipAnimations[categoryId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      console.log('Categoría seleccionada:', categoryId);
      setSelectedCategory(categoryId);
      setLoading(true);
      setIsSearching(true);
      setSelectedTiming('');

      const result = await searchProducts({
        q: searchQuery,
        category: categoryId.toString(),
        timing: selectedTiming,
        limit: pageSize,
        offset: 0,
      });

      setProducts(result.products);
      setProductCount(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
      setProductCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (resetPage = true) => {
    try {
      if (resetPage) {
        setLoading(true);
        setCurrentPage(0);
      } else {
        setLoadingMore(true);
      }
      setIsSearching(true);

      const categoryFilter = selectedCategory !== null ? selectedCategory.toString() : '';
      const offset = resetPage ? 0 : currentPage * pageSize;

      const result = await searchProducts({
        q: searchQuery,
        category: categoryFilter,
        timing: selectedTiming,
        limit: pageSize,
        offset,
      });

      if (resetPage) {
        setProducts(result.products);
        setCurrentPage(1);
      } else {
        setProducts([...products, ...result.products]);
        setCurrentPage(currentPage + 1);
      }

      setProductCount(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      if (resetPage) {
        setProducts([]);
        setProductCount(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore && !loading) {
      handleSearch(false);
    }
  };

  const handleTimingFilter = (timing: string) => {
    setSelectedTiming(timing);
    setIsSearching(true);
  };

  const removeTimingFilter = () => {
    setSelectedTiming('');
    setIsSearching(true);
  };

  // Ejecutar búsqueda cuando cambien los filtros
  useEffect(() => {
    if (isSearching || selectedTiming || selectedCategory !== null) {
      handleSearch(true);
    }
  }, [selectedTiming, selectedCategory]);

  // Debounce para búsqueda por texto
  useEffect(() => {
    if (!searchQuery.trim() && !isSearching) return;

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedTiming('');
    setSelectedCategory(null);
    setIsSearching(false);
    setCurrentPage(0);
    searchProducts({ q: '', category: '', timing: '', type: '', limit: pageSize, offset: 0 }).then(
      (result) => {
        setProducts(result.products);
        setProductCount(result.total);
        setHasMore(result.hasMore);
      }
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
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

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name='search' size={20} color='#999' style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder='Buscar productos...'
              placeholderTextColor='#666'
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name='close-circle' size={20} color='#999' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros inline - Categorías */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Categoría:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timingScrollContainer}
          >
            <TouchableOpacity
              style={[
                styles.timingFilterButton,
                selectedCategory === null && styles.timingFilterButtonActive,
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setSelectedTiming('');
                setSearchQuery('');
                setIsSearching(true);
                searchProducts({
                  q: '',
                  category: '',
                  timing: '',
                  type: '',
                  limit: pageSize,
                  offset: 0,
                }).then((result) => {
                  setProducts(result.products);
                  setProductCount(result.total);
                  setHasMore(result.hasMore);
                  setCurrentPage(0);
                });
              }}
            >
              <Text
                style={[
                  styles.timingFilterText,
                  selectedCategory === null && styles.timingFilterTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={[
                  styles.timingFilterButton,
                  selectedCategory === category.category_id && styles.timingFilterButtonActive,
                ]}
                onPress={() => handleCategoryChange(category.category_id)}
              >
                <Text
                  style={[
                    styles.timingFilterText,
                    selectedCategory === category.category_id && styles.timingFilterTextActive,
                  ]}
                >
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filtros inline - Timing */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Momento:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timingScrollContainer}
          >
            {[
              { value: '', label: 'Todos' },
              { value: 'antes', label: 'Antes' },
              { value: 'durante', label: 'Durante' },
              { value: 'despues', label: 'Después' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timingFilterButton,
                  selectedTiming === option.value && styles.timingFilterButtonActive,
                ]}
                onPress={() => handleTimingFilter(option.value)}
              >
                <Text
                  style={[
                    styles.timingFilterText,
                    selectedTiming === option.value && styles.timingFilterTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chips de filtros activos y contador */}
        {(selectedTiming || searchQuery) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.resultsCount}>{productCount} productos</Text>
            {selectedTiming && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {selectedTiming === 'antes' && 'Antes'}
                  {selectedTiming === 'durante' && 'Durante'}
                  {selectedTiming === 'despues' && 'Después'}
                  {selectedTiming === 'diario' && 'Diario'}
                </Text>
                <TouchableOpacity onPress={removeTimingFilter}>
                  <Ionicons name='close' size={16} color='#1a1919' />
                </TouchableOpacity>
              </View>
            )}
            {searchQuery && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{searchQuery}</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name='close' size={16} color='#1a1919' />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor='#D4AF37'
              colors={['#D4AF37']}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size='small' color='#D4AF37' />
                <Text style={styles.loadingMoreText}>Cargando más productos...</Text>
              </View>
            ) : null
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
    marginBottom: 16,
  },

  // Búsqueda
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  filtersLabel: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    minWidth: 70,
  },
  timingScrollContainer: {
    paddingHorizontal: 4,
  },
  timingFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#444',
  },
  timingFilterButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  timingFilterText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  timingFilterTextActive: {
    color: '#1a1919',
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  resultsCount: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    color: '#1a1919',
    fontSize: 13,
    fontWeight: '600',
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
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
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
