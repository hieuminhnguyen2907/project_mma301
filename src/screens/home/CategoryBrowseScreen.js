import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { toggleProductFavorite, fetchFavorites } from '../../store/slices/productSlice';
import { productService } from '../../services/productService';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography } from '../../config/theme';
import { ROUTES } from '../../constants/routes';

export const CategoryBrowseScreen = ({ route, navigation }) => {
  const { category } = route.params || {};
  const dispatch = useDispatch();
  const { favorites = [] } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [selectedSort, setSelectedSort] = useState('newest');
  // Local list so the category filter does not overwrite the Home feed in Redux
  const [items, setItems] = useState([]);

  useEffect(() => {
    let isActive = true;
    if (category?.id) {
      productService
        .getProducts({ categoryId: category.id, sortBy: selectedSort })
        .then((results) => {
          if (isActive) setItems(results);
        })
        .catch((err) => console.warn('Category browse error:', err.message));
    }
    dispatch(fetchFavorites(user ? user.uid : 'guest_device'));
    return () => {
      isActive = false;
    };
  }, [category?.id, selectedSort, dispatch, user?.uid]);

  const handleFavoritePress = (product) => {
    dispatch(
      toggleProductFavorite({
        userId: user ? user.uid : 'guest_device',
        productId: product.id,
      })
    );
  };

  const filteredItems = items.filter(
    (p) => !category?.id || p.categoryId === category.id
  );

  return (
    <View style={styles.container}>
      <Header
        title={category?.name || 'Danh mục sản phẩm'}
        onBackPress={() => navigation.goBack()}
      />

      {/* Category Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.categoryDesc}>{category?.description}</Text>
        <Text style={styles.conditionNote}>
          📋 Gồm {category?.subCategories?.length || 0} loại sản phẩm, mỗi loại có bộ tiêu chí khai báo tình trạng riêng.
        </Text>
      </View>

      {/* Sorting Tabs */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[styles.sortTab, selectedSort === 'newest' && styles.sortTabActive]}
          onPress={() => setSelectedSort('newest')}
        >
          <Text
            style={[
              styles.sortTabText,
              selectedSort === 'newest' && styles.sortTabTextActive,
            ]}
          >
            Mới nhất
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortTab, selectedSort === 'price_asc' && styles.sortTabActive]}
          onPress={() => setSelectedSort('price_asc')}
        >
          <Text
            style={[
              styles.sortTabText,
              selectedSort === 'price_asc' && styles.sortTabTextActive,
            ]}
          >
            Giá thấp nhất
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortTab, selectedSort === 'price_desc' && styles.sortTabActive]}
          onPress={() => setSelectedSort('price_desc')}
        >
          <Text
            style={[
              styles.sortTabText,
              selectedSort === 'price_desc' && styles.sortTabTextActive,
            ]}
          >
            Giá cao nhất
          </Text>
        </TouchableOpacity>
      </View>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="Chưa có sản phẩm nào"
          subtitle={`Hiện chưa có người bán đăng sản phẩm trong danh mục ${category?.name || ''}.`}
          actionTitle="Đăng bán ngay"
          onActionPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_SELL })}
        />
      ) : (
        <FlatList
          data={filteredItems}
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
  infoBanner: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  conditionNote: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  sortBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sortTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
  },
  sortTabActive: {
    backgroundColor: colors.primarySoft,
  },
  sortTabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.sm,
  },
  gridItemWrapper: {
    width: '50%',
    padding: 6,
  },
});
