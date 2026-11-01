import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadCart,
  updateCartItemQuantity,
  removeCartItem,
  selectCartGroups,
} from '../../store/slices/cartSlice';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { ROUTES } from '../../constants/routes';

export const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const sellerGroups = useSelector(selectCartGroups);

  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="Giỏ hàng" onBackPress={() => navigation.goBack()} />
        <View style={styles.guestBox}>
          <Ionicons name="cart-outline" size={54} color={colors.primary} />
          <Text style={styles.guestTitle}>Đăng nhập để xem giỏ hàng</Text>
          <Text style={styles.guestSubtitle}>
            Giỏ hàng của bạn sẽ được lưu đồng bộ an toàn trên tài khoản.
          </Text>
          <Button
            title="Đăng nhập ngay"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
            style={{ width: '80%', marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Giỏ hàng" onBackPress={() => navigation.goBack()} />
        <EmptyState
          icon="cart-outline"
          title="Giỏ hàng trống"
          subtitle="Bạn chưa chọn món đồ cũ nào vào giỏ."
          actionTitle="Khám phá chợ ngay"
          onActionPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_EXPLORE })}
        />
      </View>
    );
  }

  const handleProceedCheckout = (sellerGroup) => {
    if (sellerGroup.availableItems.length === 0) {
      Alert.alert('Không thể thanh toán', 'Các sản phẩm của người bán này hiện đã hết hàng.');
      return;
    }
    navigation.navigate(ROUTES.CHECKOUT, {
      sellerId: sellerGroup.sellerId,
      sellerName: sellerGroup.sellerName,
      items: sellerGroup.availableItems,
      subtotal: sellerGroup.subtotal,
    });
  };

  const handleChangeQuantity = async (item, quantity) => {
    try {
      await dispatch(updateCartItemQuantity({ productId: item.productId, quantity })).unwrap();
    } catch (err) {
      // e.g. "Chỉ còn 1 sản phẩm khả dụng" - previously swallowed silently
      Alert.alert('Không thể cập nhật', String(err));
    }
  };

  const handleRemove = (item) => {
    Alert.alert('Xóa khỏi giỏ hàng', `Bỏ "${item.productName}" khỏi giỏ hàng?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => dispatch(removeCartItem(item.productId)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Giỏ hàng của bạn" onBackPress={() => navigation.goBack()} />

      {/* 1-Seller Policy Rule Callout */}
      <View style={styles.policyAlert}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <Text style={styles.policyAlertText}>
          Quy tắc ReMarket: Mỗi lần thanh toán chỉ áp dụng cho sản phẩm từ 1 người bán để đảm bảo đơn hàng và phí vận chuyển chính xác.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sellerGroups.map((group) => {
          return (
            <View key={group.sellerId} style={styles.sellerGroupCard}>
              {/* Seller Header */}
              <View style={styles.sellerGroupHeader}>
                <View style={styles.sellerNameRow}>
                  <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                  <Text style={styles.sellerGroupName} numberOfLines={1}>{group.sellerName}</Text>
                </View>
                <Text style={styles.sellerItemCount}>{group.items.length} món</Text>
              </View>

              {/* Items in this seller group */}
              {group.items.map((item) => (
                <View key={item.productId} style={styles.itemRow}>
                  <Image
                    source={{ uri: item.primaryImage }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text numberOfLines={1} style={styles.itemName}>
                      {item.productName}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price)}
                    </Text>
                    {item.previousPrice !== undefined && (
                      <Text style={styles.itemWarning}>
                        Giá đã thay đổi (trước đây {formatCurrency(item.previousPrice)})
                      </Text>
                    )}
                    {item.isAvailable === false && (
                      <Text style={styles.itemWarning}>
                        {item.availableStock > 0
                          ? `Chỉ còn ${item.availableStock} món - vui lòng giảm số lượng`
                          : 'Đã hết hàng - không thể thanh toán'}
                      </Text>
                    )}

                    {/* Quantity Stepper */}
                    <View style={styles.qtyRow}>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            item.quantity <= 1
                              ? handleRemove(item)
                              : handleChangeQuantity(item, item.quantity - 1)
                          }
                        >
                          <Ionicons name="remove" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={[
                            styles.stepBtn,
                            item.quantity >= (item.availableStock ?? Infinity) && styles.stepBtnDisabled,
                          ]}
                          disabled={item.quantity >= (item.availableStock ?? Infinity)}
                          onPress={() => handleChangeQuantity(item, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemove(item)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {/* Group Subtotal & Checkout CTA */}
              <View style={styles.groupFooter}>
                <View style={styles.subtotalBox}>
                  <Text style={styles.subtotalLabel}>Tạm tính (chưa gồm ship):</Text>
                  <Text style={styles.subtotalValue}>
                    {formatCurrency(group.subtotal)}
                  </Text>
                </View>
                <Button
                  title="Thanh toán với shop này"
                  variant="primary"
                  size="sm"
                  disabled={group.availableItems.length === 0}
                  onPress={() => handleProceedCheckout(group)}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  guestBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  guestTitle: {
    ...typography.h2,
    marginTop: spacing.md,
  },
  guestSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  policyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#99F6E4',
  },
  policyAlertText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sellerGroupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  sellerGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  sellerGroupName: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
    flexShrink: 1,
  },
  sellerItemCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
  },
  itemPrice: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.borderLight,
  },
  qtyText: {
    paddingHorizontal: 10,
    fontWeight: '700',
    fontSize: 13,
  },
  itemWarning: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 2,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  removeBtn: {
    padding: 6,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  subtotalBox: {
    flex: 1,
    marginRight: spacing.sm,
  },
  subtotalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  subtotalValue: {
    ...typography.price,
    fontSize: 16,
  },
});
