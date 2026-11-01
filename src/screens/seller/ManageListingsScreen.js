import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { productService } from '../../services/productService';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { ConditionTag } from '../../components/product/ConditionTag';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { ROUTES } from '../../constants/routes';

export const ManageListingsScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await productService.getProducts({ sellerId: user.uid, forceRefresh: true });
      setMyProducts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyProducts();
  }, [user]);

  const handleToggleHide = async (product) => {
    const isCurrentlyHidden = product.status === 'hidden';

    if (isCurrentlyHidden && product.hiddenBy === 'admin') {
      Alert.alert(
        'Tin đang bị quản trị viên ẩn',
        `${product.hiddenReason ? `Lý do: ${product.hiddenReason}\n\n` : ''}Bạn không thể tự hiển thị lại tin này. Vui lòng liên hệ quản trị viên để được xem xét.`
      );
      return;
    }

    Alert.alert(
      isCurrentlyHidden ? 'Hiện lại bài đăng' : 'Tạm ẩn bài đăng',
      isCurrentlyHidden
        ? 'Bài đăng sẽ hiển thị công khai trở lại trên chợ?'
        : 'Người mua sẽ không thể tìm thấy hoặc mua sản phẩm này trong lúc ẩn?',
      [
        { text: 'Hủy' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await productService.setListingVisibility(product.id, isCurrentlyHidden, user.uid);
              loadMyProducts();
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
      <Header
        title="Quản lý tin đăng bán"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_SELL })}>
            <Ionicons name="add-circle" size={26} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {loading && myProducts.length === 0 ? (
        // Avoid flashing the empty state before the first load finishes
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : myProducts.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="Bạn chưa đăng bán món đồ nào"
          subtitle="Hãy thanh lý đồ cũ bạn không còn dùng để kiếm thêm thu nhập."
          actionTitle="Đăng bán ngay"
          onActionPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_SELL })}
        />
      ) : (
        <FlatList
          data={myProducts}
          refreshing={loading}
          onRefresh={loadMyProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.topRow}>
                <Image source={{ uri: item.primaryImage }} style={styles.thumb} />
                <View style={styles.info}>
                  <Text numberOfLines={2} style={styles.title}>
                    {item.name}
                  </Text>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                  <View style={styles.statusRow}>
                    <ConditionTag condition={item.condition?.overallRating} />
                    <Text style={styles.stockText}>Kho: {item.stockQuantity}</Text>
                    {item.status === 'sold_out' && (
                      <Text style={styles.soldOutBadge}>ĐÃ BÁN HẾT</Text>
                    )}
                    {item.status === 'hidden' && (
                      <Text style={styles.hiddenBadge}>
                        {item.hiddenBy === 'admin' ? 'BỊ ADMIN ẨN' : 'ĐANG ẨN'}
                      </Text>
                    )}
                    {item.status === 'rejected' && (
                      <Text style={styles.soldOutBadge}>BỊ TỪ CHỐI</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.actionsBar}>
                <View style={styles.statsRow}>
                  <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{item.viewCount || 0}</Text>
                  <Ionicons
                    name="heart-outline"
                    size={14}
                    color={colors.textSecondary}
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={styles.statText}>{item.favoriteCount || 0}</Text>
                </View>

                <View style={styles.btnRow}>
                  {item.status !== 'rejected' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleToggleHide(item)}
                    >
                      <Ionicons
                        name={item.status === 'hidden' ? 'eye' : 'eye-off-outline'}
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.actionBtnText}>
                        {item.status === 'hidden' ? 'Hiện tin' : 'Ẩn tin'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, { marginLeft: 8 }]}
                    onPress={() =>
                      navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: item.id })
                    }
                  >
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                      Xem bài
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
  },
  price: {
    ...typography.price,
    fontSize: 16,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  stockText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  soldOutBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  hiddenBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...typography.caption,
    marginLeft: 3,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F8FAFC',
  },
  actionBtnText: {
    ...typography.caption,
    marginLeft: 4,
    fontWeight: '600',
  },
});
