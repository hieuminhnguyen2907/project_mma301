import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { authService } from '../../services/authService';
import { adminService } from '../../services/adminService';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../../config/theme';

export const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: admin } = useSelector((state) => state.auth);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await authService.getAllUsers();
      setUsers(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const isSuspended = user.status === 'suspended';
    Alert.alert(
      isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
      isSuspended
        ? `Cho phép ${user.displayName} hoạt động trở lại?`
        : `Tạm khóa tài khoản ${user.displayName}? Người dùng sẽ không thể đăng nhập hoặc giao dịch.`,
      [
        { text: 'Hủy' },
        {
          text: 'Đồng ý',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await authService.toggleUserStatus(user.uid, user.status);
              await adminService.logModerationAction({
                adminId: admin?.uid,
                adminEmail: admin?.email,
                action: isSuspended ? 'REACTIVATE_USER' : 'SUSPEND_USER',
                targetType: 'user',
                targetId: user.uid,
                reason: isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản do hành vi bất thường',
              });
              loadUsers();
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
      <Header title="Quản lý người dùng" onBackPress={() => navigation.goBack()} />

      <FlatList
        data={users}
        refreshing={loading}
        onRefresh={loadUsers}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Image
                source={{
                  uri:
                    item.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                }}
                style={styles.avatar}
              />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Text
                    style={[
                      styles.roleBadge,
                      item.role === 'admin' ? styles.roleAdmin : styles.roleUser,
                    ]}
                  >
                    {(item.role || 'buyer_seller').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.phone}>{item.phoneNumber}</Text>
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'active' ? styles.statusActive : styles.statusSuspended,
                  ]}
                >
                  Trạng thái: {item.status === 'suspended' ? 'Đang bị khóa' : 'Hoạt động'}
                </Text>
              </View>
            </View>

            {item.role !== 'admin' && (
              <Button
                title={item.status === 'suspended' ? 'Mở khóa tài khoản' : 'Khóa tài khoản này'}
                variant={item.status === 'suspended' ? 'primary' : 'danger'}
                size="sm"
                onPress={() => handleToggleStatus(item)}
                style={{ marginTop: spacing.sm }}
              />
            )}
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderLight,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleAdmin: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
  },
  roleUser: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  phone: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
  statusActive: {
    color: colors.success,
  },
  statusSuspended: {
    color: colors.danger,
  },
});
