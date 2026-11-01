import React from 'react';
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
import { logoutUser } from '../../store/slices/authSlice';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { StarRating } from '../../components/common/StarRating';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { ROUTES } from '../../constants/routes';

export const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="Tài khoản của tôi" showBack={false} />
        <View style={styles.guestContainer}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>Chào mừng bạn đến với ReMarket</Text>
          <Text style={styles.guestSubtitle}>
            Đăng nhập để theo dõi đơn hàng, quản lý tin đăng bán và bảo vệ giao dịch.
          </Text>
          <Button
            title="Đăng nhập / Đăng ký tài khoản"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
            style={{ width: '85%', marginTop: spacing.lg }}
          />
        </View>
      </View>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <View style={styles.container}>
      <Header title="Tài khoản" showBack={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.userCard}
          onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
        >
          <Image
            source={{
              uri:
                user.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
              {isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>}
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phoneNumber || 'Chưa thêm số điện thoại'}</Text>
            <View style={styles.ratingRow}>
              {user.ratingCount > 0 ? (
                <>
                  <StarRating rating={user.ratingAverage} size={14} showLabel />
                  <Text style={styles.ratingCountText}>({user.ratingCount} đánh giá)</Text>
                </>
              ) : (
                <Text style={styles.ratingCountText}>Chưa có đánh giá</Text>
              )}
            </View>
          </View>
          <View style={styles.editBadge}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editBadgeText}>Sửa</Text>
          </View>
        </TouchableOpacity>

        {/* Section: Hồ sơ cá nhân */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeader}>Tài khoản & Hồ sơ cá nhân</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
          >
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[styles.menuItemText, { marginLeft: 0 }]}>Xem & Chỉnh sửa hồ sơ của tôi</Text>
              <Text style={styles.menuItemSubText}>Họ tên, ảnh đại diện, số điện thoại, tiểu sử</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ADMIN DASHBOARD SHORTCUT (Prominently displayed for Admin) */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate(ROUTES.ADMIN_STACK)}
          >
            <View style={styles.adminIconBox}>
              <Ionicons name="shield-checkmark" size={26} color={colors.textInverse} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.adminTitle}>Bảng điều khiển Quản trị (Admin Console)</Text>
              <Text style={styles.adminSub}>
                Kiểm duyệt bài đăng, xử lý tranh chấp khiếu nại, thống kê doanh số
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        )}

        {/* Section: Hoạt động Mua hàng */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeader}>Dành cho Người mua (Buyer)</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.BUYER_ORDERS)}
          >
            <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Đơn mua của tôi</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.CHAT_LIST)}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Tin nhắn & Thương lượng</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.ADDRESS_MANAGER)}
          >
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Sổ địa chỉ nhận hàng</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_FAVORITES })}
          >
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Sản phẩm đã yêu thích</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Hoạt động Bán hàng */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeader}>Dành cho Người bán (Seller)</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.WALLET)}
          >
            <Ionicons name="wallet-outline" size={20} color="#059669" />
            <Text style={[styles.menuItemText, { color: '#059669', fontWeight: '700' }]}>
              Ví ReMarket & Doanh thu COD
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.SELLER_ORDERS)}
          >
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Quản lý đơn khách đặt</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.MANAGE_LISTINGS)}
          >
            <Ionicons name="albums-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Quản lý các tin đăng bán</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_SELL })}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>Đăng bài bán đồ cũ mới</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <Button
          title="Đăng xuất tài khoản"
          variant="outline"
          size="md"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  guestTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  guestSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.borderLight,
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    ...typography.h3,
    flexShrink: 1,
  },
  adminBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  adminBadgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  ratingCountText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 4,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textInverse,
  },
  adminSub: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  menuSectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemText: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.md,
  },
  menuItemSubText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    marginLeft: 6,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 3,
  },
  logoutBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
