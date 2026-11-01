import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchProductDetail, toggleProductFavorite, fetchFavorites } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { calculateConditionScore } from '../../utils/conditionScore';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { ConditionTag } from '../../components/product/ConditionTag';
import { DefectList } from '../../components/product/DefectList';
import { StarRating } from '../../components/common/StarRating';
import { ProductLocationMap } from '../../components/common/ProductLocationMap';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { ROUTES } from '../../constants/routes';
import { getConditionFieldLabel, getCategoryConditionSchema } from '../../constants/categories';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { selectedProduct, favorites } = useSelector((state) => state.products);
  // Ignore the previously viewed product while this one is still loading
  const product = selectedProduct?.id === productId ? selectedProduct : null;
  const { user } = useSelector((state) => state.auth);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setLoadError(null);
    if (productId) {
      dispatch(fetchProductDetail(productId))
        .unwrap()
        .catch((err) => setLoadError(String(err || 'Không tìm thấy sản phẩm')));
    } else {
      setLoadError('Không tìm thấy sản phẩm');
    }
    dispatch(fetchFavorites(user ? user.uid : 'guest_device'));
  }, [productId, dispatch, user?.uid]);

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Header title="Chi tiết sản phẩm" onBackPress={() => navigation.goBack()} />
        {loadError ? (
          <EmptyState
            icon="cube-outline"
            title="Sản phẩm không còn tồn tại"
            subtitle="Tin đăng này có thể đã bị người bán gỡ hoặc bị quản trị viên xóa."
            actionTitle="Quay lại"
            onActionPress={() => navigation.goBack()}
          />
        ) : (
          <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
        )}
      </View>
    );
  }

  const isFavorite = favorites.some((f) => f.id === product.id);
  const isOwner = user && user.uid === product.sellerId;
  const isSoldOut = product.status === 'sold_out' || product.stockQuantity <= 0;
  // Hidden / rejected / pending listings can still be opened from favorites, a cart or a
  // chat, but must not be purchasable
  const isUnavailable = !isSoldOut && product.status !== 'active';
  const cannotBuy = isSoldOut || isUnavailable;
  const conditionScore = calculateConditionScore(product);
  const sellerRatingCount = product.sellerRatingCount ?? (product.sellerRating ? undefined : 0);
  const hasSellerRating = Boolean(product.sellerRating) && sellerRatingCount !== 0;
  const isTrustedSeller = hasSellerRating && sellerRatingCount >= 5 && product.sellerRating >= 4.5;
  const defaultBuyerAddress =
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;

  // Declared condition in the order and wording of this product type's form; keys from
  // older listings that are not in the form are listed after it
  const conditionSchema = getCategoryConditionSchema(product.categoryId, product.subCategoryId);
  const conditionEntries = Object.entries(product.condition || {}).filter(
    ([key, val]) =>
      key !== 'overallRating' &&
      val !== undefined &&
      val !== null &&
      val !== '' &&
      !(Array.isArray(val) && val.length === 0)
  );
  const schemaOrder = conditionSchema.map((f) => f.fieldKey);
  const conditionRows = conditionEntries
    .sort(([a], [b]) => {
      const ia = schemaOrder.indexOf(a);
      const ib = schemaOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(([key, val]) => {
      const field = conditionSchema.find((f) => f.fieldKey === key);
      const unit = field?.unit || (key === 'batteryHealth' ? '%' : '');
      return {
        key,
        label: getConditionFieldLabel(key, product.categoryId, product.subCategoryId),
        value: Array.isArray(val) ? val.join(', ') : unit ? `${val} ${unit}`.replace(' %', '%') : String(val),
      };
    });

  const handleToggleFav = () => {
    dispatch(
      toggleProductFavorite({
        userId: user ? user.uid : 'guest_device',
        productId: product.id,
      })
    );
  };

  const handleOpenChat = () => {
    if (!user) {
      navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
      return;
    }
    if (isOwner) {
      Alert.alert('Thông báo', 'Đây là sản phẩm do bạn đăng bán.');
      return;
    }
    navigation.navigate(ROUTES.CHAT_DETAIL, { product });
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
      return;
    }

    if (isOwner) {
      Alert.alert('Không hợp lệ', 'Bạn không thể mua sản phẩm của chính mình đăng bán.');
      return;
    }

    if (cannotBuy) {
      Alert.alert('Không thể mua', isSoldOut ? 'Sản phẩm này đã được bán.' : 'Tin đăng này hiện không mở bán.');
      return;
    }

    try {
      await dispatch(
        addToCart({ product, quantity: 1, userId: user.uid })
      ).unwrap();
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng!', [
        { text: 'Tiếp tục xem' },
        { text: 'Xem giỏ hàng', onPress: () => navigation.navigate(ROUTES.CART) },
      ]);
    } catch (err) {
      Alert.alert('Thông báo', String(err?.message || err));
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
      return;
    }

    if (isOwner) {
      Alert.alert('Không hợp lệ', 'Bạn không thể mua sản phẩm của chính mình đăng bán.');
      return;
    }

    if (cannotBuy) {
      Alert.alert('Không thể mua', isSoldOut ? 'Sản phẩm này đã được bán.' : 'Tin đăng này hiện không mở bán.');
      return;
    }

    // Buy Now goes straight to checkout with this single item; adding it to the cart
    // first failed when the (single-unit) item was already there
    navigation.navigate(ROUTES.CHECKOUT, {
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      directItem: {
        productId: product.id,
        productName: product.name,
        primaryImage: product.primaryImage,
        price: product.price,
        quantity: 1,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        categoryName: product.categoryName,
      },
    });
  };

  const handleReport = () => {
    if (!user) {
      navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
      return;
    }
    if (isOwner) {
      Alert.alert('Thông báo', 'Bạn không thể báo cáo tin đăng của chính mình.');
      return;
    }
    navigation.navigate(ROUTES.CREATE_REPORT, {
      targetType: 'product',
      targetId: product.id,
      targetName: product.name,
      targetOwnerId: product.sellerId,
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Chi tiết sản phẩm"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleReport} style={{ padding: 4 }}>
            <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + insets.bottom }]}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((imgUri, index) => (
                <Image
                  key={index}
                  source={{ uri: imgUri }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              <Image
                source={{ uri: product.primaryImage }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            )}
          </ScrollView>

          {/* Pagination Dots */}
          {product.images && product.images.length > 1 && (
            <View style={styles.dotsRow}>
              {product.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Condition Tag on top of image */}
          <View style={styles.imageConditionOverlay}>
            <ConditionTag condition={product.condition?.overallRating} size="md" />
          </View>
        </View>

        {/* Product Basic Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            {product.originalPrice > 0 && (
              <Text style={styles.originalPrice}>
                {formatCurrency(product.originalPrice)}
              </Text>
            )}
          </View>

          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{product.categoryName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {product.location?.district ? `${product.location.district}, ` : ''}
                {product.location?.city || 'Hồ Chí Minh'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>Kho: {product.stockQuantity}</Text>
            </View>
          </View>
        </View>

        {/* ReMarket Condition Score & Valuation Estimator Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View style={styles.scoreNumberCircle}>
              <Text style={styles.scoreNumberText}>{conditionScore.score}</Text>
              <Text style={styles.scoreOutOfText}>/100</Text>
            </View>
            <View style={styles.scoreDetails}>
              <View style={styles.scoreBadgeRow}>
                <Text style={styles.scoreTitle}>ĐIỂM TỪ KHAI BÁO TÌNH TRẠNG</Text>
              </View>
              <View style={[styles.scorePill, { backgroundColor: conditionScore.color }]}>
                <Text style={styles.scorePillText}>{conditionScore.label}</Text>
              </View>
              <Text style={styles.benchmarkText}>
                Tính tự động từ thông tin người bán khai báo, chỉ để tham khảo. ReMarket không kiểm định sản phẩm.
              </Text>
            </View>
          </View>
        </View>

        {/* Standardized Condition Checklist Card */}
        <View style={styles.conditionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tình trạng chi tiết khai báo</Text>
          </View>

          {Boolean(product.subCategoryName) && (
            <View style={styles.subCatDetailBadge}>
              <Ionicons name="pricetag" size={12} color={colors.primary} />
              <Text style={styles.subCatDetailBadgeText}>
                Phân loại: {product.subCategoryName}
              </Text>
            </View>
          )}

          <Text style={styles.conditionDisclaimer}>
            * Thông tin do người bán tự khai báo theo đúng phân loại của món đồ. ReMarket lưu trữ bản chụp đối chứng khi có khiếu nại.
          </Text>

          <View style={styles.specsTable}>
            {conditionRows.map(({ key, label, value }) => (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specLabel}>{label}:</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Known Defects Card */}
        <View style={styles.defectsCard}>
          <Text style={styles.defectsHeader}>Lỗi đã biết (Known Defects):</Text>
          <DefectList defects={product.knownDefects} />
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>Mô tả của người bán</Text>
          <Text style={styles.descBody}>{product.description}</Text>
        </View>

        {/* Seller Location & Interactive Map */}
        <ProductLocationMap
          location={product.location}
          sellerName={product.sellerName}
          buyerAddress={defaultBuyerAddress}
          onMeetupPress={(address) => {
            if (!user) {
              navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
              return;
            }
            if (isOwner) {
              Alert.alert('Thông báo', 'Đây là sản phẩm do bạn đăng bán.');
              return;
            }
            navigation.navigate(ROUTES.CHAT_DETAIL, {
              product,
              initialMessage: `Chào bạn, mình xem sản phẩm "${product.name}" thấy bạn ở khu vực ${address}. Mình có thể hẹn qua xem hàng trực tiếp được không?`,
            });
          }}
        />

        {/* Seller Info Card */}
        <View style={styles.sellerCard}>
          <Image
            source={{
              uri: product.sellerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            }}
            style={styles.sellerAvatar}
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{product.sellerName}</Text>
            <View style={styles.sellerRatingRow}>
              {hasSellerRating ? (
                <StarRating rating={product.sellerRating} size={14} showLabel />
              ) : (
                <Text style={styles.newSellerText}>Người bán mới - chưa có đánh giá</Text>
              )}
              {isTrustedSeller && <Text style={styles.sellerBadge}>Người bán uy tín</Text>}
            </View>
          </View>
          <TouchableOpacity style={styles.chatSellerBtn} onPress={handleOpenChat}>
            <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
            <Text style={styles.chatSellerText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { height: 70 + insets.bottom, paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={handleToggleFav}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? colors.danger : colors.textSecondary}
          />
        </TouchableOpacity>

        {isOwner ? (
          // The seller cannot chat with or buy their own listing
          <Button
            title="Quản lý tin đăng của bạn"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate(ROUTES.MANAGE_LISTINGS)}
            style={styles.buyNowBtn}
          />
        ) : (
          <>
            {/* Direct Chat / Negotiation Button */}
            <TouchableOpacity
              style={styles.chatActionBtn}
              onPress={handleOpenChat}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
              <Text style={styles.chatActionBtnText}>Nhắn tin</Text>
            </TouchableOpacity>

            <Button
              title="Thêm giỏ"
              variant="outline"
              size="sm"
              onPress={handleAddToCart}
              disabled={cannotBuy}
              style={styles.cartActionBtn}
            />

            <Button
              title={isSoldOut ? 'Hết hàng' : isUnavailable ? 'Ngừng bán' : 'Mua ngay'}
              variant="primary"
              size="sm"
              onPress={handleBuyNow}
              disabled={cannotBuy}
              style={styles.buyNowBtn}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  newSellerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.subtitle,
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  galleryContainer: {
    width: '100%',
    height: 300,
    backgroundColor: colors.borderLight,
    position: 'relative',
  },
  galleryImage: {
    width: width,
    height: 300,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  imageConditionOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  price: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 24,
  },
  originalPrice: {
    ...typography.bodySmall,
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    marginLeft: 10,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    marginTop: 4,
  },
  metaText: {
    ...typography.caption,
    marginLeft: 4,
  },
  subCatDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    gap: 4,
    marginTop: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  subCatDetailBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
  },
  conditionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    marginLeft: 6,
    color: colors.primary,
  },
  conditionDisclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  specsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  specLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 120,
  },
  specValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  defectsCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  defectsHeader: {
    ...typography.subtitle,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  descCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  descTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginBottom: 8,
  },
  descBody: {
    ...typography.body,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderLight,
  },
  sellerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  sellerName: {
    ...typography.subtitle,
    fontWeight: '700',
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  sellerBadge: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  chatSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  chatSellerText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumberCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  scoreNumberText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 26,
  },
  scoreOutOfText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    lineHeight: 12,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  scorePill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.pill,
    marginVertical: 4,
  },
  scorePillText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  benchmarkText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 6,
    backgroundColor: colors.primarySoft,
  },
  chatActionBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    ...shadows.lg,
  },
  favBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  cartActionBtn: {
    flex: 1,
    marginRight: 6,
  },
  buyNowBtn: {
    flex: 1.2,
  },
});
