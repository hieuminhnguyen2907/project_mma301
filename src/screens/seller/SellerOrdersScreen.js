import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSellerOrders,
  confirmSellerOrder,
  rejectSellerOrder,
  shipSellerOrder,
} from '../../store/slices/orderSlice';
import { Header } from '../../components/common/Header';
import { OrderCard } from '../../components/order/OrderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography } from '../../config/theme';
import { ROUTES } from '../../constants/routes';

export const SellerOrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { sellerOrders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  // Order whose transition is in flight: blocks double taps (the 2nd tap used to fail
  // with "cannot transition" because the first one had already succeeded)
  const [busyOrderId, setBusyOrderId] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchSellerOrders({ sellerId: user.uid }));
    }
  }, [user, dispatch]);

  // Pick up orders cancelled/completed by buyers while this screen was in the background
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        if (user) dispatch(fetchSellerOrders({ sellerId: user.uid }));
      }),
    [navigation, user, dispatch]
  );

  const handleConfirm = (order) => {
    Alert.alert(
      'Xác nhận đơn hàng',
      `Bạn xác nhận còn hàng và sẽ đóng gói đơn ${order.orderNumber}?`,
      [
        { text: 'Hủy' },
        {
          text: 'Xác nhận ngay',
          onPress: async () => {
            setBusyOrderId(order.id);
            try {
              await dispatch(
                confirmSellerOrder({ orderId: order.id, sellerId: user.uid })
              ).unwrap();
              Alert.alert('Thành công', 'Đã xác nhận đơn hàng.');
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

  const handleOpenReject = (order) => {
    setSelectedOrder(order);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (busyOrderId) return;
    if (rejectReason.trim().length < 5) {
      Alert.alert('Nhắc nhở', 'Vui lòng cung cấp lý do từ chối đơn (ít nhất 5 ký tự).');
      return;
    }

    setBusyOrderId(selectedOrder.id);
    try {
      await dispatch(
        rejectSellerOrder({
          orderId: selectedOrder.id,
          sellerId: user.uid,
          reason: rejectReason.trim(),
        })
      ).unwrap();
      setRejectModalVisible(false);
      Alert.alert('Đã từ chối', 'Đơn hàng đã được từ chối và kho hàng đã được khôi phục.');
    } catch (err) {
      Alert.alert('Lỗi', String(err));
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleOpenShip = (order) => {
    setSelectedOrder(order);
    setTrackingInput('');
    setShipModalVisible(true);
  };

  const handleConfirmShip = async () => {
    if (busyOrderId) return;
    if (trackingInput.trim().length < 4) {
      Alert.alert('Nhắc nhở', 'Vui lòng nhập mã vận đơn do đơn vị vận chuyển cung cấp.');
      return;
    }
    setBusyOrderId(selectedOrder.id);
    try {
      await dispatch(
        shipSellerOrder({
          orderId: selectedOrder.id,
          sellerId: user.uid,
          trackingCode: trackingInput.trim(),
        })
      ).unwrap();
      setShipModalVisible(false);
      Alert.alert('Thành công', 'Đã chuyển đơn hàng sang trạng thái đang giao hàng.');
    } catch (err) {
      Alert.alert('Lỗi', String(err));
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Quản lý đơn bán" onBackPress={() => navigation.goBack()} />

      {sellerOrders.length === 0 ? (
        <EmptyState
          icon="storefront-outline"
          title="Chưa có đơn hàng nào"
          subtitle="Khi có người mua đặt đồ cũ bạn đăng bán, đơn hàng sẽ hiển thị tại đây."
        />
      ) : (
        <FlatList
          data={sellerOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              actorRole="seller"
              onPress={() => navigation.navigate(ROUTES.ORDER_DETAIL, { order: item })}
              onConfirmOrder={handleConfirm}
              onRejectOrder={handleOpenReject}
              onShipOrder={handleOpenShip}
              busy={busyOrderId === item.id}
            />
          )}
        />
      )}

      {/* Reject Order Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        title="Từ chối đơn hàng"
        scrollable
      >
        <Text style={styles.modalSubtitle}>
          Vui lòng nhập lý do từ chối để thông báo cho người mua. Tồn kho của bạn sẽ được tự động hoàn lại.
        </Text>
        <Input
          label="Lý do từ chối *"
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="Ví dụ: Sản phẩm vừa phát hiện lỗi hỏng hoặc hết hàng..."
          multiline
          numberOfLines={3}
        />
        <Button
          title="Xác nhận từ chối"
          variant="danger"
          size="md"
          loading={Boolean(busyOrderId)}
          onPress={handleConfirmReject}
          style={{ marginTop: spacing.sm }}
        />
      </Modal>

      {/* Shipping Tracking Code Modal */}
      <Modal
        visible={shipModalVisible}
        onClose={() => setShipModalVisible(false)}
        title="Cập nhật gửi hàng"
        scrollable
      >
        <Text style={styles.modalSubtitle}>
          Nhập mã vận đơn bưu cục để người mua có thể theo dõi hành trình giao nhận.
        </Text>
        <Input
          label="Mã vận đơn bưu cục *"
          value={trackingInput}
          onChangeText={setTrackingInput}
          placeholder="VNPOST-829103"
          autoCapitalize="characters"
          maxLength={40}
        />
        <Button
          title="Xác nhận đã gửi hàng"
          variant="primary"
          size="md"
          loading={Boolean(busyOrderId)}
          onPress={handleConfirmShip}
          style={{ marginTop: spacing.sm }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
