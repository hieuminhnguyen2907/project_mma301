import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../store/slices/notificationSlice';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { formatDate } from '../../utils/date';
import { ROUTES } from '../../constants/routes';
import { orderService } from '../../services/orderService';

export const NotificationCenterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(loadNotifications(user.uid));
    }
  }, [user, dispatch]);

  const handleNotificationPress = async (notif) => {
    dispatch(markNotificationRead(notif.id));
    if (notif.data?.orderId) {
      // Sellers get order notifications too, so open the order itself instead of
      // always jumping to the buyer's order list
      try {
        const order = await orderService.getOrderById(notif.data.orderId);
        navigation.navigate(ROUTES.ORDER_DETAIL, { order });
      } catch (_err) {
        // Order not reachable (offline): open the list matching the user's role in it
        const isSellerNotice = ['ORDER_CREATED', 'ORDER_CANCELLED', 'ORDER_COMPLETED'].includes(notif.type);
        navigation.navigate(isSellerNotice ? ROUTES.SELLER_ORDERS : ROUTES.BUYER_ORDERS);
      }
    } else if (notif.data?.productId) {
      navigation.navigate(
        notif.type?.startsWith('LISTING_') ? ROUTES.MANAGE_LISTINGS : ROUTES.PRODUCT_DETAIL,
        { productId: notif.data.productId }
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Thông báo"
        onBackPress={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={() => dispatch(markAllNotificationsRead(user.uid))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Không có thông báo mới"
          subtitle="Các cập nhật trạng thái đơn hàng và tin nhắn kiểm duyệt sẽ gửi về đây."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.notifCard, !item.isRead && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
            >
              <View
                style={[
                  styles.iconCircle,
                  !item.isRead ? styles.unreadIcon : styles.readIcon,
                ]}
              >
                <Ionicons
                  name={item.type?.includes('ORDER') ? 'bag-handle-outline' : 'notifications-outline'}
                  size={20}
                  color={!item.isRead ? colors.primary : colors.textSecondary}
                />
              </View>

              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.dot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
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
  listContent: {
    padding: spacing.md,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  unreadCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  unreadIcon: {
    backgroundColor: colors.primarySoft,
  },
  readIcon: {
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  unreadTitle: {
    fontWeight: '700',
    color: colors.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  time: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
