import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, toggleProductFavorite, fetchFavorites } from '../../store/slices/productSlice';
import { loadCart, selectCartTotalCount } from '../../store/slices/cartSlice';
import { loadNotifications } from '../../store/slices/notificationSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { ProductCard } from '../../components/product/ProductCard';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { ROUTES } from '../../constants/routes';

export const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { items, categories: reduxCategories, favorites = [] } = useSelector((state) => state.products);
  const categories = reduxCategories && reduxCategories.length >= DEFAULT_CATEGORIES.length
    ? reduxCategories.map((c) => {
        const canonical = DEFAULT_CATEGORIES.find((dc) => dc.id === c.id);
        return canonical ? { ...c, name: canonical.name, icon: canonical.icon || c.icon } : c;
      })
    : DEFAULT_CATEGORIES;
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartTotalCount);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(loadCart());
    dispatch(fetchFavorites(user ? user.uid : 'guest_device'));
    // The session is restored after the first focus event, so load the badge here too
    if (user) dispatch(loadNotifications(user.uid));
  }, [dispatch, user?.uid]);

  // Re-sync stock/sold-out badges when coming back from checkout or other screens
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        dispatch(fetchProducts());
        // Keeps the bell badge current after orders change elsewhere
        if (user) dispatch(loadNotifications(user.uid));
      }),
    [navigation, dispatch, user]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchProducts({ forceRefresh: true }));
    await dispatch(loadCart());
    await dispatch(fetchFavorites(user ? user.uid : 'guest_device'));
    setRefreshing(false);
  };

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
      {/* App Top Bar with Safe Area Insets */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 10,
            height: (insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 10) + 56,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>ReMarket</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_EXPLORE })}
          >
            <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => {
              if (!user) {
                navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
              } else {
                navigation.navigate(ROUTES.CHAT_LIST);
              }
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => navigation.navigate(ROUTES.CART)}
          >
            <Ionicons name="cart-outline" size={22} color={colors.textPrimary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => {
              if (!user) {
                navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
              } else {
                navigation.navigate(ROUTES.NOTIFICATIONS);
              }
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {user && unreadCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Search Bar Shortcut */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.searchBar}
          onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_EXPLORE })}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Tìm điện thoại, áo khoác, sách cũ...</Text>
          <TouchableOpacity
            style={styles.visualSearchCamera}
            onPress={() => navigation.navigate(ROUTES.VISUAL_SEARCH)}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextContent}>
            <Text style={styles.heroTag}>MINH BẠCH • AN TÂM</Text>
            <Text style={styles.heroTitle}>Chợ Đồ Cũ Tiết Kiệm</Text>
            <Text style={styles.heroSubtitle}>
              Khai báo chi tiết tình trạng máy & cam kết không giấu lỗi
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_SELL })}
            >
              <Text style={styles.heroBtnText} textBreakStrategy="simple">Đăng bán đồ cũ ngay</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroImagePlaceholder}>
            <Ionicons name="sparkles" size={48} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </View>

        {/* AI Visual Search Promotion Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.aiBanner}
          onPress={() => navigation.navigate(ROUTES.VISUAL_SEARCH)}
        >
          <View style={styles.aiIconCircle}>
            <Ionicons name="scan-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.aiTextContent}>
            <Text style={styles.aiTitle}>AI Visual Search (Gemini)</Text>
            <Text style={styles.aiSubtitle}>
              Chụp hoặc tải ảnh đồ cũ để AI tìm sản phẩm tương tự tức thì
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() =>
                navigation.navigate(ROUTES.CATEGORY_BROWSE, {
                  category: cat,
                })
              }
            >
              <View style={styles.categoryIconCircle}>
                <Ionicons name={cat.icon || 'grid-outline'} size={24} color={colors.primary} />
              </View>
              <Text numberOfLines={3} style={styles.categoryName}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Latest Second-Hand Listings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm mới đăng</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_EXPLORE })}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {items.map((prod) => (
            <View key={prod.id} style={styles.gridItemWrapper}>
              <ProductCard
                product={prod}
                isFavorite={favorites.some((f) => f.id === prod.id)}
                onPress={() =>
                  navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: prod.id })
                }
                onFavoritePress={handleFavoritePress}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 8,
  },
  brandName: {
    ...typography.h2,
    color: colors.primary,
    fontSize: 20,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 6,
    marginLeft: 6,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchPlaceholder: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginLeft: 8,
    flex: 1,
  },
  visualSearchCamera: {
    padding: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.pill,
  },
  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  heroTextContent: {
    flex: 1,
    zIndex: 2,
  },
  heroTag: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textInverse,
    fontSize: 20,
  },
  heroSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  heroBtn: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    marginRight: 4,
  },
  heroImagePlaceholder: {
    marginLeft: spacing.sm,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  aiIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  aiTextContent: {
    flex: 1,
  },
  aiTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  categoriesScroll: {
    paddingBottom: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.md + 4,
    width: 86,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 6,
    ...shadows.sm,
  },
  categoryName: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItemWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: spacing.md,
  },
});
