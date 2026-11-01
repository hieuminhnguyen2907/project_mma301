import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/order/StatusBadge';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { ORDER_STATUS, ORDER_STATUS_DETAILS } from '../../constants/orderStatus';
import { ROUTES } from '../../constants/routes';
import { orderService } from '../../services/orderService';

const CONDITION_LABELS = {
  'Like New': 'Như mới',
  'Very Good': 'Rất tốt',
  Good: 'Tốt',
  Acceptable: 'Chấp nhận được',
  'Needs Repair': 'Cần sửa chữa',
};

export const OrderDetailScreen = ({ route, navigation }) => {
  const { order: orderParam, orderId } = route.params || {};
  const { user } = useSelector((state) => state.auth);
  // The param is a snapshot from the list: reload so status, tracking code and the
  // dispute flag are current (also when returning from the return-request screen)
  const [order, setOrder] = useState(orderParam || null);
  const targetId = orderParam?.id || orderId;

  useEffect(() => {
    if (!targetId) return undefined;
    const load = () =>
      orderService
        .getOrderById(targetId)
        .then(setOrder)
        .catch(() => {});
    load();
    return navigation.addListener('focus', load);
  }, [targetId, navigation]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Chi tiết đơn hàng" onBackPress={() => navigation.goBack()} />
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Không tìm thấy đơn hàng</Text>
      </View>
    );
  }

  const handleCreateReturn = () => {
    navigation.navigate(ROUTES.CREATE_RETURN, { order });
  };

  return (
    <View style={styles.container}>
      <Header title={`Đơn hàng ${order.orderNumber}`} onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.orderNumberTitle}>{order.orderNumber}</Text>
              <Text style={styles.orderDate}>Ngày đặt: {formatDate(order.createdAt)}</Text>
            </View>
            <StatusBadge status={order.status} size="md" />
          </View>
          {order.trackingCode && (
            <View style={styles.trackingBox}>
              <Ionicons name="barcode-outline" size={18} color={colors.primary} />
              <Text style={styles.trackingText}>
                Mã vận đơn: <Text style={{ fontWeight: '700' }}>{order.trackingCode}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* State Machine History Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lịch sử tiến trình đơn hàng</Text>
          <View style={styles.timeline}>
            {order.statusHistory?.map((step, idx) => (
              <View key={idx} style={styles.timelineStep}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineStatus}>
                      {ORDER_STATUS_DETAILS[step.newStatus]?.label || step.newStatus}
                    </Text>
                    <Text style={styles.timelineTime}>{formatDate(step.timestamp)}</Text>
                  </View>
                  <Text style={styles.timelineReason}>{step.reason}</Text>
                  <Text style={styles.timelineActor}>
                    Tác nhân: {step.actorRole === 'buyer' ? 'Người mua' : step.actorRole === 'seller' ? 'Người bán' : 'Hệ thống'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, styles.iconTitleText]}>Địa chỉ nhận hàng</Text>
          </View>
          <Text style={styles.recipientName}>
            {order.buyerAddress?.recipientName} ({order.buyerAddress?.phoneNumber})
          </Text>
          <Text style={styles.addressText}>
            {[order.buyerAddress?.street, order.buyerAddress?.ward, order.buyerAddress?.district, order.buyerAddress?.city]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {order.buyerNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Lời nhắn của người mua:</Text>
              <Text style={styles.noteText}>{order.buyerNote}</Text>
            </View>
          ) : null}
        </View>

        {/* Item Snapshots */}
        <View style={styles.card}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="storefront-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, styles.iconTitleText]}>Người bán: {order.sellerName}</Text>
          </View>

          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemCard}>
              <Image source={{ uri: item.primaryImage }} style={styles.itemThumb} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.price)} x {item.quantity}
                </Text>
                {item.conditionSnapshot && (
                  <View style={styles.snapshotBadge}>
                    <Text style={styles.snapshotText}>
                      Tình trạng lúc mua: {CONDITION_LABELS[item.conditionSnapshot.overallRating] || item.conditionSnapshot.overallRating}
                      {item.conditionSnapshot.workingCondition ? ` (${item.conditionSnapshot.workingCondition})` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.deliveryFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng tiền (COD):</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {order.hasDispute && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Đơn hàng đang có yêu cầu trả hàng / khiếu nại</Text>
            <Text style={styles.noteText}>Quản trị viên ReMarket sẽ xử lý và gửi kết quả qua thông báo.</Text>
          </View>
        )}

        {/* Return / Dispute CTA if order is completed */}
        {order.status === ORDER_STATUS.COMPLETED && user?.uid === order.buyerId && !order.hasDispute && (
          <Button
            title="Yêu cầu trả hàng / Khiếu nại giao dịch"
            variant="outline"
            size="md"
            onPress={handleCreateReturn}
            style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  noteBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warningSoft,
  },
  noteLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  orderNumberTitle: {
    ...typography.subtitle,
    fontWeight: '700',
  },
  orderDate: {
    ...typography.caption,
    marginTop: 2,
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  trackingText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 6,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  // The row already spaces itself from the content below
  iconTitleText: {
    marginBottom: 0,
    marginLeft: 6,
    flexShrink: 1,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStatus: {
    ...typography.bodySmall,
    flexShrink: 1,
    marginRight: spacing.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  timelineReason: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineActor: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  recipientName: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  addressText: {
    ...typography.caption,
    marginTop: 2,
    color: colors.textSecondary,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  itemPrice: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  snapshotBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  snapshotText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
