import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { ROUTES } from '../../constants/routes';

export const OrderSuccessScreen = ({ route, navigation }) => {
  const { order } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={48} color={colors.textInverse} />
        </View>

        <Text style={styles.title}>Đặt hàng thành công!</Text>
        <Text style={styles.subtitle}>
          Cảm ơn bạn đã mua sắm trên ReMarket. Đơn hàng của bạn đã được chuyển tới người bán để chuẩn bị đóng gói.
        </Text>

        {order && (
          <View style={styles.orderInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
              <Text style={styles.infoValue}>{order.orderNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người bán:</Text>
              <Text style={styles.infoValue}>{order.sellerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phương thức:</Text>
              <Text style={styles.infoValue}>COD (Thanh toán khi nhận hàng)</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Tổng tiền:</Text>
              <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' }]}>
                {formatCurrency(order.totalAmount)}
              </Text>
            </View>
          </View>
        )}

        <Button
          title="Xem đơn hàng của tôi"
          variant="primary"
          size="lg"
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: ROUTES.APP_TABS }, { name: ROUTES.BUYER_ORDERS }],
            })
          }
          style={{ width: '100%', marginBottom: spacing.sm }}
        />

        <Button
          title="Tiếp tục mua sắm"
          variant="outline"
          size="lg"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.APP_TABS, params: { screen: ROUTES.TAB_HOME } }],
            })
          }
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  orderInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
});
