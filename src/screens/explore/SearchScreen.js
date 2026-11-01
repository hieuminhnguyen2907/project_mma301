import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { toggleProductFavorite, fetchFavorites } from '../../store/slices/productSlice';
import { productService } from '../../services/productService';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { ROUTES } from '../../constants/routes';

export const SearchScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { categories: reduxCategories, favorites = [] } = useSelector((state) => state.products);
  const categories = reduxCategories && reduxCategories.length >= DEFAULT_CATEGORIES.length
    ? reduxCategories.map((c) => {
        const canonical = DEFAULT_CATEGORIES.find((dc) => dc.id === c.id);
        return canonical ? { ...c, name: canonical.name, icon: canonical.icon || c.icon } : c;
      })
    : DEFAULT_CATEGORIES;
  const { user } = useSelector((state) => state.auth);

  const [query, setQuery] = useState(route?.params?.initialQuery || '');
  // What the product list is filtered by: follows the input after a short pause, so a
  // keystroke does not trigger a catalogue fetch each time
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [priceRange, setPriceRange] = useState(null); // null | 'under_1m' | '1m_to_5m' | 'over_5m'
  // Local results: writing filtered lists into the shared products.items would leak the
  // search filters into the Home feed
  const [items, setItems] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Refresh when the tab regains focus (e.g. after posting a new listing)
  useEffect(() => navigation.addListener('focus', () => setReloadKey((k) => k + 1)), [navigation]);

  // Keyword handed over by another screen (e.g. Visual Search "Tìm bằng từ khóa")
  useEffect(() => {
    if (route?.params?.initialQuery !== undefined) {
      setQuery(route.params.initialQuery);
      setDebouncedQuery(route.params.initialQuery);
      navigation.setParams({ initialQuery: undefined });
    }
  }, [route?.params?.initialQuery, navigation]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let isActive = true;
    let minPrice;
    let maxPrice;

    if (priceRange === 'under_1m') {
      minPrice = 0;
      maxPrice = 999999;
    } else if (priceRange === '1m_to_5m') {
      minPrice = 1000000;
      maxPrice = 5000000;
    } else if (priceRange === 'over_5m') {
      minPrice = 5000000;
    }

    productService
      .getProducts({
        query: debouncedQuery,
        categoryId: selectedCat,
        conditionRating: selectedCondition,
        sortBy: selectedSort,
        minPrice,
        maxPrice,
      })
      .then((results) => {
        // Drop responses that arrive after a newer query was issued
        if (isActive) setItems(results);
      })
      .catch((err) => console.warn('Search error:', err.message));
    dispatch(fetchFavorites(user ? user.uid : 'guest_device'));

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, selectedCat, selectedCondition, selectedSort, priceRange, reloadKey, dispatch, user?.uid]);

  const handleFavoritePress = (product) => {
    dispatch(
      toggleProductFavorite({
        userId: user ? user.uid : 'guest_device',
        productId: product.id,
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search Input with Safe Area */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 10,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm kiếm theo tên sản phẩm, mô tả..."
            placeholderTextColor={colors.textMuted}
            style={styles.textInput}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.visualSearchBtn}
          onPress={() => navigation.navigate(ROUTES.VISUAL_SEARCH)}
        >
          <Ionicons name="camera-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
          {/* Category Filter */}
          <TouchableOpacity
            style={[styles.pill, selectedCat === 'all' && styles.pillActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.pillText, selectedCat === 'all' && styles.pillTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.pill, selectedCat === c.id && styles.pillActive]}
              onPress={() => setSelectedCat(selectedCat === c.id ? 'all' : c.id)}
            >
              <Text style={[styles.pillText, selectedCat === c.id && styles.pillTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterRow}>
          {/* Price Range Filters */}
          <TouchableOpacity
            style={[styles.subPill, priceRange === 'under_1m' && styles.subPillActive]}
            onPress={() => setPriceRange(priceRange === 'under_1m' ? null : 'under_1m')}
          >
            <Text style={[styles.subPillText, priceRange === 'under_1m' && styles.subPillTextActive]}>
              Dưới 1 triệu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subPill, priceRange === '1m_to_5m' && styles.subPillActive]}
            onPress={() => setPriceRange(priceRange === '1m_to_5m' ? null : '1m_to_5m')}
          >
            <Text style={[styles.subPillText, priceRange === '1m_to_5m' && styles.subPillTextActive]}>
              1Tr - 5Tr
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subPill, priceRange === 'over_5m' && styles.subPillActive]}
            onPress={() => setPriceRange(priceRange === 'over_5m' ? null : 'over_5m')}
          >
            <Text style={[styles.subPillText, priceRange === 'over_5m' && styles.subPillTextActive]}>
              Trên 5 triệu
            </Text>
          </TouchableOpacity>

          {/* Condition Filter */}
          <TouchableOpacity
            style={[styles.subPill, selectedCondition === 'Like New' && styles.subPillActive]}
            onPress={() => setSelectedCondition(selectedCondition === 'Like New' ? null : 'Like New')}
          >
            <Text style={[styles.subPillText, selectedCondition === 'Like New' && styles.subPillTextActive]}>
              ✨ Như mới
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subPill, selectedCondition === 'Very Good' && styles.subPillActive]}
            onPress={() => setSelectedCondition(selectedCondition === 'Very Good' ? null : 'Very Good')}
          >
            <Text style={[styles.subPillText, selectedCondition === 'Very Good' && styles.subPillTextActive]}>
              👍 Rất tốt
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Result Count */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCount}>Tìm thấy {items.length} sản phẩm phù hợp</Text>
        <TouchableOpacity
          onPress={() =>
            // Cycle newest -> price ascending -> price descending -> newest
            setSelectedSort((prev) =>
              prev === 'newest' ? 'price_asc' : prev === 'price_asc' ? 'price_desc' : 'newest'
            )
          }
          style={styles.sortToggle}
        >
          <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
          <Text style={styles.sortToggleText}>
            {selectedSort === 'price_asc'
              ? 'Giá tăng dần'
              : selectedSort === 'price_desc'
              ? 'Giá giảm dần'
              : 'Mới nhất'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {items.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy sản phẩm"
          subtitle="Hãy thử thay đổi từ khóa hoặc đặt lại bộ lọc để tìm thêm đồ cũ."
          actionTitle="Đặt lại bộ lọc"
          onActionPress={() => {
            setQuery('');
            setSelectedCat('all');
            setPriceRange(null);
            setSelectedCondition(null);
            setSelectedSort('newest');
          }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.gridItemWrapper}>
              <ProductCard
                product={item}
                isFavorite={favorites.some((f) => f.id === item.id)}
                onPress={() =>
                  navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: item.id })
                }
                onFavoritePress={handleFavoritePress}
              />
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  visualSearchBtn: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.pill,
  },
  filtersWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
  },
  filterPillsScroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.borderLight,
    marginRight: 8,
    flexShrink: 0,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pillTextActive: {
    color: colors.textInverse,
  },
  subFilterRow: {
    paddingHorizontal: spacing.md,
    paddingTop: 6,
  },
  subPill: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.pill,
    marginRight: 6,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  subPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  subPillText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  subPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  listContent: {
    padding: 6,
  },
  gridItemWrapper: {
    width: '50%',
    padding: 6,
  },
});
