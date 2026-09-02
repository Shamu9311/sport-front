import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { getProductCategories, searchProducts } from '../../src/services/api';
import { getProductImageSource } from '../../src/utils/imageUtils';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import FilterChip from '../../src/components/ui/FilterChip';
import EmptyState from '../../src/components/ui/EmptyState';
import PressableScale from '../../src/components/ui/PressableScale';
import ProductImageFrame from '../../src/components/ui/ProductImageFrame';
import { colors, fontFamily, radius, shadows, spacing } from '../../src/theme';
import { MIN_SKELETON_MS, withMinimumDuration } from '../../src/utils/withMinimumDuration';
import { getCategoryColorsFromName } from '../../src/utils/categoryColors';
import Toast from 'react-native-toast-message';

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

type SearchOverrides = Partial<{
  q: string;
  category: number | null;
  timing: string;
}>;

const ProductListScreen = () => {
  const insets = useSafeAreaInsets();
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
  const filterEffectArmedRef = useRef(false);
  const searchDebounceArmedRef = useRef(false);
  const currentPageRef = useRef(0);
  const handleSearchRef = useRef<
    (resetPage?: boolean, overrides?: SearchOverrides) => Promise<void>
  >(async () => {});

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

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
        const result = await withMinimumDuration(
          searchProducts({
            q: '',
            category: '',
            timing: '',
            type: '',
            limit: pageSize,
            offset: 0,
          }),
          MIN_SKELETON_MS
        );
        setProducts(result.products);
        setProductCount(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(1);
        setSelectedCategory(null); // null = "Todos"
      } catch (error) {
        console.error('Error loading products:', error);
        Toast.show({
          type: 'error',
          text1: 'Error al cargar productos',
          text2: 'Verifica tu conexión e intenta de nuevo.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await withMinimumDuration(
        searchProducts({
          q: searchQuery,
          category: selectedCategory !== null ? selectedCategory.toString() : '',
          timing: selectedTiming,
          limit: pageSize,
          offset: 0,
        }),
        MIN_SKELETON_MS
      );
      setProducts(result.products);
      setProductCount(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error refreshing products:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al actualizar',
        text2: 'No se pudieron cargar los productos.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryChange = (categoryId: number) => {
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

    setSelectedCategory(categoryId);
    setSelectedTiming('');
    setIsSearching(true);
  };

  const handleSearch = useCallback(
    async (resetPage = true, overrides?: SearchOverrides) => {
      const q = overrides?.q !== undefined ? overrides.q : searchQuery;
      const cat = overrides?.category !== undefined ? overrides.category : selectedCategory;
      const timing = overrides?.timing !== undefined ? overrides.timing : selectedTiming;

      try {
        if (resetPage) {
          setCurrentPage(0);
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setIsSearching(true);

        const categoryFilter = cat !== null ? String(cat) : '';
        const offset = resetPage ? 0 : currentPageRef.current * pageSize;

        const searchPromise = searchProducts({
          q,
          category: categoryFilter,
          timing,
          type: '',
          limit: pageSize,
          offset,
        });
        const result = resetPage
          ? await withMinimumDuration(searchPromise, MIN_SKELETON_MS)
          : await searchPromise;

        if (resetPage) {
          setProducts(result.products);
          setCurrentPage(1);
        } else {
          setProducts((prev) => [...prev, ...result.products]);
          setCurrentPage((prev) => prev + 1);
        }

        setProductCount(result.total);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        Toast.show({
          type: 'error',
          text1: 'Error en la búsqueda',
          text2: 'No se pudieron obtener los productos.',
        });
        if (resetPage) {
          setProducts([]);
          setProductCount(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, selectedCategory, selectedTiming, pageSize]
  );

  useEffect(() => {
    handleSearchRef.current = handleSearch;
  });

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

  // Ejecutar búsqueda cuando cambien los filtros (evita doble fetch en el montaje inicial)
  useEffect(() => {
    if (!filterEffectArmedRef.current) {
      filterEffectArmedRef.current = true;
      return;
    }
    handleSearchRef.current(true);
  }, [selectedTiming, selectedCategory]);

  // Debounce para búsqueda por texto (no dispara en el primer montaje)
  useEffect(() => {
    if (!searchDebounceArmedRef.current) {
      searchDebounceArmedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      handleSearchRef.current(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedTiming('');
    setSelectedCategory(null);
    setIsSearching(false);
    setCurrentPage(0);
    handleSearchRef.current(true, { q: '', category: null, timing: '' });
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const productName = item.product_name || item.name || 'Sin nombre';
    const categoryName =
      item.category_name ||
      categories.find((c) => c.category_id === item.category_id)?.name;
    const { color: categoryColor } = getCategoryColorsFromName(categoryName);

    return (
      <PressableScale
        style={styles.productItem}
        onPress={() => router.push(`/products/${item.product_id}`)}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={`Ver producto ${productName}`}
      >
        <View style={[styles.categoryStripe, { backgroundColor: categoryColor }]} />
        <View style={styles.productImageContainer}>
          <ProductImageFrame style={styles.productImageFrame}>
            <Image
              source={getProductImageSource(item.image_url)}
              style={styles.productImage}
              resizeMode='contain'
            />
          </ProductImageFrame>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.product_description || item.description || 'Sin descripción'}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.viewDetailsText}>Ver producto</Text>
            <Ionicons name='chevron-forward' size={14} color={colors.primaryText} />
          </View>
        </View>
      </PressableScale>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header de la página */}
      <View style={[styles.pageHeader, { paddingTop: Math.max(insets.top + 12, 52) }]}>
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
            <FilterChip
              label="Todos"
              selected={selectedCategory === null}
              onPress={() => {
                setSelectedCategory(null);
                setSelectedTiming('');
                setSearchQuery('');
                setIsSearching(true);
                handleSearchRef.current(true, { q: '', category: null, timing: '' });
              }}
            />
            {categories.map((category) => {
              const { color } = getCategoryColorsFromName(category.name);
              return (
                <FilterChip
                  key={category.category_id}
                  label={category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                  selected={selectedCategory === category.category_id}
                  selectedColor={color}
                  onPress={() => handleCategoryChange(category.category_id)}
                />
              );
            })}
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
              <FilterChip
                key={option.value}
                label={option.label}
                selected={selectedTiming === option.value}
                onPress={() => handleTimingFilter(option.value)}
              />
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
          keyExtractor={(item) => `product-${item.product_id}`}
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
            <EmptyState
              iconName='cube-outline'
              title='Sin productos'
              subtitle='No hay productos disponibles en esta categoría.'
            />
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
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
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    marginRight: 12,
    minWidth: 70,
  },
  timingScrollContainer: {
    paddingHorizontal: 4,
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
    fontFamily: fontFamily.semibold,
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
    fontFamily: fontFamily.semibold,
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
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  categoryStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  productImageContainer: {
    width: 100,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.md,
    paddingVertical: spacing.md,
  },
  productImageFrame: {
    width: 84,
    height: 84,
  },
  productImage: {
    width: 68,
    height: 68,
  },
  productInfo: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 4,
    lineHeight: 21,
  },
  productDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  productFooter: {
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

export default ProductListScreen;
