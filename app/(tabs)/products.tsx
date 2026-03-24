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
import SkeletonLoader from '../../src/components/SkeletonLoader';
import { colors } from '../../src/theme';

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
            <Ionicons name='arrow-forward-circle' size={18} color={colors.primary} />
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
            <Ionicons name='search' size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder='Buscar productos...'
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name='close-circle' size={20} color={colors.textSecondary} />
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
                  <Ionicons name='close' size={16} color={colors.textOnPrimary} />
                </TouchableOpacity>
              </View>
            )}
            {searchQuery && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{searchQuery}</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name='close' size={16} color={colors.textOnPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader type="productList" />
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size='small' color={colors.primary} />
                <Text style={styles.loadingMoreText}>Cargando más productos...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name='cube-outline' size={60} color={colors.textSecondary} style={{ marginBottom: 15 }} />
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
    backgroundColor: colors.background,
  },

  pageHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
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
    color: colors.primary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  timingFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timingFilterText: {
    color: colors.textPrimary,
    opacity: 0.85,
    fontSize: 13,
    fontWeight: '600',
  },
  timingFilterTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '700',
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
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 15,
  },

  categoryContainer: {
    backgroundColor: colors.surface,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 0,
    elevation: 3,
    shadowColor: colors.shadow,
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
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
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
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    minWidth: 110,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textPrimary,
    opacity: 0.88,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

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
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
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
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  productDescription: {
    color: colors.textPrimary,
    opacity: 0.88,
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
    borderTopColor: colors.border,
  },
  viewDetailsText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyText: {
    color: colors.textPrimary,
    opacity: 0.85,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  },
});

export default ProductListScreen;
