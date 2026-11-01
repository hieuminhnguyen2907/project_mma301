import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBuyerOrders,
  cancelBuyerOrder,
  completeBuyerOrder,
} from '../../store/slices/orderSlice';
import { Header } from '../../components/common/Header';
import { OrderCard } from '../../components/order/OrderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography } from '../../config/theme';
import { ORDER_STATUS } from '../../constants/orderStatus';
import { ROUTES } from '../../constants/routes';

export const BuyerOrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { buyerOrders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('ALL');
  const [busyOrderId, setBusyOrderId] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchBuyerOrders({ buyerId: user.uid, status: activeTab }));
    }
  }, [user, activeTab, dispatch]);

  // Refetch when returning (e.g. from the review screen) so isReviewed/status are fresh
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        if (user) dispatch(fetchBuyerOrders({ buyerId: user.uid, status: activeTab }));
      }),
    [navigation, user, activeTab, dispatch]
  );

  const handleCancelOrder = (order) => {
    Alert.alert(
      'Hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng ${order.orderNumber}? (Số lượng sản phẩm sẽ được hoàn trả lại cho người bán)`,
      [
        { text: 'Không' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            setBusyOrderId(order.id);
            try {
              await dispatch(
                cancelBuyerOrder({
                  orderId: order.id,
                  buyerId: user.uid,
                  reason: 'Người mua chủ động hủy trước khi đóng gói',
                })
              ).unwrap();
              Alert.alert('Thành công', 'Đơn hàng đã được hủy.');
            } catch (err) {
              Alert.alert('Lỗi', String(err));
            } finally {
              setBusyOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleCompleteOrder = (order) => {
    Alert.alert(
      'Xác nhận đã nhận hàng',
      'Bạn đã kiểm tra hàng và thanh toán đủ tiền COD cho shipper?',
      [
        { text: 'Chưa' },
        {
          text: 'Đã nhận đủ',
          onPress: async () => {
            setBusyOrderId(order.id);
            try {
              const completed = await dispatch(
                completeBuyerOrder({ orderId: order.id, buyerId: user.uid })
              ).unwrap();
              Alert.alert(
                'Hoàn tất',
                'Cảm ơn bạn! Hãy để lại đánh giá cho người bán để giúp cộng đồng ReMarket an tâm hơn.',
                [
                  {
                    text: 'Đánh giá ngay',
                    onPress: () =>
                      navigation.navigate(ROUTES.CREATE_REVIEW, { order: completed }),
                  },
                  { text: 'Để sau' },
                ]
              );
            } catch (err) {
              Alert.alert('Lỗi', String(err));
            } finally {
              setBusyOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleReviewOrder = (order) => {
    navigation.navigate(ROUTES.CREATE_REVIEW, { order });
  };

  const filteredOrders =
    activeTab === 'ALL'
      ? buyerOrders
      : buyerOrders.filter((o) => o.status === activeTab);

  return (
    <View style={styles.container}>
      <Header title="Đơn mua của tôi" onBackPress={() => navigation.goBack()} />

      {/* Status Tabs Bar */}
      <View style={styles.tabBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: ORDER_STATUS.PENDING_CONFIRMATION, label: 'Chờ xác nhận' },
            { key: ORDER_STATUS.CONFIRMED, label: 'Đã xác nhận' },
            { key: ORDER_STATUS.SHIPPING, label: 'Đang giao' },
            { key: ORDER_STATUS.COMPLETED, label: 'Đã nhận' },
            { key: ORDER_STATUS.CANCELLED, label: 'Đã hủy' },
            { key: ORDER_STATUS.REJECTED, label: 'Bị từ chối' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Chưa có đơn hàng nào"
          subtitle="Các đơn mua đồ cũ của bạn sẽ hiển thị tại đây để bạn tiện theo dõi trạng thái."
          actionTitle="Mua sắm ngay"
          onActionPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_HOME })}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              actorRole="buyer"
              onPress={() => navigation.navigate(ROUTES.ORDER_DETAIL, { order: item })}
              onCancelOrder={handleCancelOrder}
              onCompleteOrder={handleCompleteOrder}
              onReviewOrder={handleReviewOrder}
              busy={busyOrderId === item.id}
            />
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
  tabBarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
  },
});
