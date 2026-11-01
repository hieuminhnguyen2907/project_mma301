import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { StatusBadge } from './StatusBadge';
import { Button } from '../common/Button';
import { ORDER_STATUS } from '../../constants/orderStatus';

export const OrderCard = ({
  order,
  onPress,
  actorRole = 'buyer', // 'buyer' | 'seller' | 'admin'
  onConfirmOrder,
  onRejectOrder,
  onCancelOrder,
  onShipOrder,
  onCompleteOrder,
  onReviewOrder,
  busy = false, // an action on this order is in flight: block repeat taps
  style,
}) => {
  const firstItem = order.items?.[0];
  // Other products in the order (not units: 1 product x2 is not "1 more item")
  const otherProductsCount = Math.max(0, (order.items?.length || 0) - 1);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Header: Order Number & Status */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Item Summary */}
      {firstItem && (
        <View style={styles.itemRow}>
          <Image
            source={{ uri: firstItem.primaryImage }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.itemInfo}>
            <Text numberOfLines={1} style={styles.itemName}>
              {firstItem.productName}
            </Text>
            <Text style={styles.itemSubtext}>
              {actorRole === 'buyer'
                ? `Người bán: ${order.sellerName}`
                : `Người mua: ${order.buyerName}`}
            </Text>
            <View style={styles.itemPriceRow}>
              <Text style={styles.itemPrice}>
                {formatCurrency(firstItem.price)}
              </Text>
              <Text style={styles.itemQty}>x{firstItem.quantity}</Text>
            </View>
          </View>
        </View>
      )}

      {otherProductsCount > 0 && (
        <Text style={styles.moreItemsText}>
          + và {otherProductsCount} sản phẩm khác trong đơn
        </Text>
      )}

      {/* Total Amount */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng tiền (COD):</Text>
        <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
      </View>

      {/* Action Buttons based on state machine and actor */}
      <View style={styles.actionsRow}>
        {actorRole === 'buyer' && (
          <>
            {order.status === ORDER_STATUS.PENDING_CONFIRMATION && onCancelOrder && (
              <Button
                title="Hủy đơn hàng"
                variant="outline"
                size="sm"
                onPress={() => onCancelOrder(order)}
                disabled={busy}
                style={{ flex: 1, marginRight: 8 }}
              />
            )}
            {order.status === ORDER_STATUS.SHIPPING && onCompleteOrder && (
              <Button
                title="Đã nhận được hàng"
                variant="primary"
                size="sm"
                onPress={() => onCompleteOrder(order)}
                disabled={busy}
                style={{ flex: 1 }}
              />
            )}
            {order.status === ORDER_STATUS.COMPLETED && !order.isReviewed && onReviewOrder && (
              <Button
                title="Đánh giá người bán"
                variant="secondary"
                size="sm"
                onPress={() => onReviewOrder(order)}
                disabled={busy}
                style={{ flex: 1 }}
              />
            )}
          </>
        )}

        {actorRole === 'seller' && (
          <>
            {order.status === ORDER_STATUS.PENDING_CONFIRMATION && (
              <View style={styles.dualButtons}>
                {onRejectOrder && (
                  <Button
                    title="Từ chối"
                    variant="danger"
                    size="sm"
                    onPress={() => onRejectOrder(order)}
                    disabled={busy}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}
                {onConfirmOrder && (
                  <Button
                    title="Xác nhận đơn"
                    variant="primary"
                    size="sm"
                    onPress={() => onConfirmOrder(order)}
                    disabled={busy}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            )}
            {order.status === ORDER_STATUS.CONFIRMED && onShipOrder && (
              <Button
                title="Xác nhận gửi hàng"
                variant="primary"
                size="sm"
                onPress={() => onShipOrder(order)}
                disabled={busy}
                style={{ flex: 1 }}
              />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  orderNumber: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
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
    color: colors.textPrimary,
  },
  itemSubtext: {
    ...typography.caption,
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
  moreItemsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  totalAmount: {
    ...typography.price,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dualButtons: {
    flexDirection: 'row',
    width: '100%',
  },
});
