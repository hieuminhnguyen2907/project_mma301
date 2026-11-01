import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { productService } from '../../services/productService';
import { adminService } from '../../services/adminService';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { ConditionTag } from '../../components/product/ConditionTag';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';

export const AdminListingsScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: admin } = useSelector((state) => state.auth);

  const MODERATION = {
    approve: { label: 'Duyệt', log: 'APPROVE_LISTING', reason: 'Tin đăng đạt tiêu chuẩn cộng đồng' },
    hide: { label: 'Ẩn', log: 'HIDE_LISTING', reason: 'Tin đăng tạm ẩn để kiểm tra thông tin khai báo' },
    reject: { label: 'Từ chối', log: 'REJECT_LISTING', reason: 'Tin đăng vi phạm chính sách khai báo tình trạng' },
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      // Admins must also see hidden/rejected/pending listings to re-approve them
      const all = await productService.getProducts({ includeAllStatuses: true, forceRefresh: true });
      setListings(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleAction = async (product, action) => {
    const { label: actionLabel, log, reason } = MODERATION[action];
    Alert.alert(
      `Xác nhận ${actionLabel}`,
      `Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} bài đăng "${product.name}"?\n\nNgười bán sẽ nhận được thông báo kèm lý do: ${reason}.`,
      [
        { text: 'Hủy' },
        {
          text: 'Thực hiện',
          onPress: async () => {
            try {
              await productService.moderateProduct(product.id, action, reason);
              await adminService.logModerationAction({
                adminId: admin?.uid,
                adminEmail: admin?.email,
                action: log,
                targetType: 'product',
                targetId: product.id,
                reason,
              });
              loadListings();
            } catch (err) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Kiểm duyệt bài đăng" onBackPress={() => navigation.goBack()} />

      <FlatList
        data={listings}
        refreshing={loading}
        onRefresh={loadListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Image source={{ uri: item.primaryImage }} style={styles.thumb} />
              <View style={styles.info}>
                <Text numberOfLines={1} style={styles.name}>
                  {item.name}
                </Text>
                <Text style={styles.seller}>Người bán: {item.sellerName}</Text>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                <View style={styles.badgeRow}>
                  <ConditionTag condition={item.condition?.overallRating} />
                  <Text
                    style={[
                      styles.statusBadge,
                      item.status === 'active'
                        ? styles.statusActive
                        : item.status === 'hidden'
                        ? styles.statusHidden
                        : styles.statusRejected,
                    ]}
                  >
                    {item.status === 'hidden' && item.hiddenBy === 'seller'
                      ? 'NGƯỜI BÁN ẨN'
                      : item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              {/* A listing the seller hid themselves is not the admin's to re-publish */}
              {item.status !== 'active' && item.status !== 'sold_out' && item.hiddenBy !== 'seller' && (
                <Button
                  title="Duyệt bài"
                  variant="primary"
                  size="sm"
                  onPress={() => handleAction(item, 'approve')}
                  style={{ marginRight: 8, flex: 1 }}
                />
              )}
              {item.status === 'active' && (
                <Button
                  title="Tạm ẩn"
                  variant="outline"
                  size="sm"
                  onPress={() => handleAction(item, 'hide')}
                  style={{ marginRight: 8, flex: 1 }}
                />
              )}
              {item.status !== 'rejected' && (
                <Button
                  title="Từ chối"
                  variant="danger"
                  size="sm"
                  onPress={() => handleAction(item, 'reject')}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        )}
      />
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  seller: {
    ...typography.caption,
    marginTop: 2,
  },
  price: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  statusHidden: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
});
