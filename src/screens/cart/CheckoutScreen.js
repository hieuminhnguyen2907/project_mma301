import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { placeOrder } from '../../store/slices/orderSlice';
import { loadCart } from '../../store/slices/cartSlice';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { calculateDeliveryFee } from '../../utils/shipping';
import { productService } from '../../services/productService';
import { ROUTES } from '../../constants/routes';

export const CheckoutScreen = ({ route, navigation }) => {
  // No `items = []` default here: a fresh array on every render made baseItems,
  // revalidate and its effect change each time, re-validating (and re-reading Firestore)
  // in an endless loop on the Buy Now path
  const { sellerName, items, directItem } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.orders);

  const baseItems = useMemo(() => (directItem ? [directItem] : items || []), [directItem, items]);

  // Re-validated against the latest product data before the buyer confirms
  // (BUSINESS_RULES: totals, delivery fee and stock are re-checked right before checkout)
  const [orderItems, setOrderItems] = useState(baseItems);
  const [deliveryFee, setDeliveryFee] = useState(calculateDeliveryFee([]));
  const [issues, setIssues] = useState([]);
  const [priceNotices, setPriceNotices] = useState([]);
  const [validating, setValidating] = useState(true);
  const [notes, setNotes] = useState('');

  // One id per visit: a double tap or retry cannot create a second order
  const checkoutIdRef = useRef(`chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const submittingRef = useRef(false);

  const subtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalAmount = subtotal + deliveryFee;

  // No silent placeholder address: an order must ship to an address the buyer entered
  const defaultAddress = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;

  const revalidate = useCallback(async () => {
    if (baseItems.length === 0) {
      setIssues(['Không có sản phẩm nào để thanh toán']);
      setValidating(false);
      return;
    }
    setValidating(true);
    const results = await Promise.all(
      baseItems.map(async (item) => {
        try {
          return { item, prod: await productService.getProductById(item.productId) };
        } catch (_err) {
          return { item, prod: null };
        }
      })
    );

    const nextIssues = [];
    const nextNotices = [];
    const nextItems = results.map(({ item, prod }) => {
      if (!prod) {
        nextIssues.push(`"${item.productName}" không còn tồn tại`);
        return item;
      }
      if (prod.sellerId === user?.uid) {
        nextIssues.push(`"${prod.name}" là sản phẩm do bạn đăng bán`);
      } else if (prod.status !== 'active' || prod.stockQuantity <= 0) {
        nextIssues.push(`"${prod.name}" đã hết hàng hoặc ngừng bán`);
      } else if (prod.stockQuantity < item.quantity) {
        nextIssues.push(`"${prod.name}" chỉ còn ${prod.stockQuantity} món`);
      }
      if (prod.price !== item.price) {
        nextNotices.push(`"${prod.name}": ${formatCurrency(item.price)} → ${formatCurrency(prod.price)}`);
      }
      return { ...item, productName: prod.name, primaryImage: prod.primaryImage, price: prod.price };
    });

    setOrderItems(nextItems);
    setDeliveryFee(calculateDeliveryFee(results.map((r) => r.prod).filter(Boolean)));
    setIssues(nextIssues);
    setPriceNotices(nextNotices);
    setValidating(false);
  }, [baseItems, user?.uid]);

  useEffect(() => {
    revalidate();
  }, [revalidate]);

  // Also refresh when returning from the address book or after another screen changed stock
  useEffect(() => navigation.addListener('focus', revalidate), [navigation, revalidate]);

  const handleConfirmOrder = async () => {
    if (submittingRef.current || validating) return;

    if (!user) {
      navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
      return;
    }

    if (!defaultAddress) {
      Alert.alert('Chưa có địa chỉ', 'Vui lòng thêm địa chỉ nhận hàng trước khi đặt hàng.', [
        { text: 'Để sau' },
        { text: 'Thêm địa chỉ', onPress: () => navigation.navigate(ROUTES.ADDRESS_MANAGER) },
      ]);
      return;
    }

    if (issues.length > 0) {
      Alert.alert('Không thể đặt hàng', issues.join('\n'));
      return;
    }

    submittingRef.current = true;
    try {
      const order = await dispatch(
        placeOrder({
          buyer: user,
          items: orderItems,
          deliveryAddress: defaultAddress,
          notes,
          checkoutId: checkoutIdRef.current,
        })
      ).unwrap();

      await dispatch(loadCart());

      navigation.replace(ROUTES.ORDER_SUCCESS, { order });
    } catch (err) {
      Alert.alert('Đặt hàng thất bại', String(err));
      // Price/stock may have moved: show the buyer the current numbers
      revalidate();
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Xác nhận thanh toán" onBackPress={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + insets.bottom }]}
        extraScrollHeight={90 + insets.bottom}
        keyboardShouldPersistTaps="handled"
      >
        {issues.length > 0 && (
          <View style={[styles.noticeCard, styles.noticeDanger]}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <View style={styles.noticeBody}>
              <Text style={[styles.noticeTitle, { color: colors.danger }]}>Không thể đặt hàng</Text>
              {issues.map((msg) => (
                <Text key={msg} style={styles.noticeText}>• {msg}</Text>
              ))}
            </View>
          </View>
        )}

        {priceNotices.length > 0 && (
          <View style={[styles.noticeCard, styles.noticeWarning]}>
            <Ionicons name="pricetag" size={18} color={colors.warning} />
            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle}>Người bán vừa cập nhật giá</Text>
              {priceNotices.map((msg) => (
                <Text key={msg} style={styles.noticeText}>• {msg}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconTitleRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, styles.iconTitleText]}>Địa chỉ nhận hàng</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.ADDRESS_MANAGER)}>
              <Text style={styles.changeLink}>Thay đổi</Text>
            </TouchableOpacity>
          </View>

          {defaultAddress ? (
            <View style={styles.addressBox}>
              <Text style={styles.recipientName}>
                {defaultAddress.recipientName} ({defaultAddress.phoneNumber})
              </Text>
              <Text style={styles.addressText}>
                {[defaultAddress.street, defaultAddress.ward, defaultAddress.district, defaultAddress.city]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addressBox}
              onPress={() => navigation.navigate(ROUTES.ADDRESS_MANAGER)}
            >
              <Text style={styles.changeLink}>+ Thêm địa chỉ nhận hàng</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items from This Seller */}
        <View style={styles.card}>
          <View style={styles.sellerRow}>
            <Ionicons name="storefront-outline" size={18} color={colors.primary} />
            <Text style={styles.sellerName}>Shop: {sellerName || 'Người bán ReMarket'}</Text>
          </View>

          {orderItems.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image
                source={{ uri: item.primaryImage }}
                style={styles.itemThumb}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text numberOfLines={1} style={styles.itemName}>
                  {item.productName}
                </Text>
                <Text style={styles.itemCategory}>{item.categoryName}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payment & Delivery Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phương thức vận chuyển & Thanh toán</Text>

          <View style={styles.methodRow}>
            <Ionicons name="bicycle-outline" size={20} color={colors.primary} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Giao hàng tiêu chuẩn</Text>
              <Text style={styles.methodSubtitle}>Nhận hàng sau 2 - 3 ngày làm việc</Text>
            </View>
            <Text style={styles.methodFee}>{formatCurrency(deliveryFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.methodRow}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Thanh toán khi nhận hàng (COD)</Text>
              <Text style={styles.methodSubtitle}>Kiểm tra đúng mô tả trước khi thanh toán</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        </View>

        {/* Buyer Notes */}
        <View style={styles.card}>
          <Input
            label="Lời nhắn cho người bán (tùy chọn)"
            value={notes}
            onChangeText={(t) => setNotes(t.slice(0, 300))}
            placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi tới..."
            style={{ marginBottom: 0 }}
          />
        </View>

        {/* Payment Summary Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky Bottom Place Order Bar */}
      <View style={[styles.bottomBar, { height: 72 + insets.bottom, paddingBottom: insets.bottom }]}>
        <View>
          <Text style={styles.bottomTotalLabel}>Tổng số tiền (COD):</Text>
          {validating ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <Text style={styles.bottomTotalValue}>{formatCurrency(totalAmount)}</Text>
          )}
        </View>
        <Button
          title="Xác nhận Đặt hàng"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={validating || issues.length > 0}
          onPress={handleConfirmOrder}
          style={styles.confirmBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  iconTitleText: {
    marginLeft: 6,
  },
  changeLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  recipientName: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  sellerName: {
    ...typography.subtitle,
    fontWeight: '700',
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemThumb: {
    width: 54,
    height: 54,
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
  itemCategory: {
    ...typography.caption,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  itemPrice: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
  },
  itemQty: {
    ...typography.caption,
    fontWeight: '600',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  methodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  methodTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  methodSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  methodFee: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    ...typography.subtitle,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.price,
    fontSize: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  noticeWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  noticeBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  noticeTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  bottomTotalLabel: {
    ...typography.caption,
  },
  bottomTotalValue: {
    ...typography.price,
    fontSize: 18,
  },
  confirmBtn: {
    minWidth: 180,
  },
});
