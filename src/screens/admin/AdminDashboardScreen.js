import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import { Header } from '../../components/common/Header';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { ROUTES } from '../../constants/routes';

export const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Bảng điều khiển Quản trị" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} colors={[colors.primary]} />}
      >
        {/* KPI Banner */}
        <View style={styles.kpiBanner}>
          <Text style={styles.kpiBannerLabel}>TỔNG GIÁ TRỊ GIAO DỊCH (GOV GIẢ LẬP)</Text>
          <Text style={styles.kpiBannerValue}>
            {formatCurrency(stats?.grossOrderValue || 0)}
          </Text>
          <Text style={styles.kpiNote}>
            * Dữ liệu mô phỏng theo thời gian thực trên nền tảng ReMarket
          </Text>
        </View>

        {/* 4 Metrics Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.metricLabel}>Người dùng ({stats?.activeUsers || 0} hoạt động)</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="cube-outline" size={22} color="#0369A1" />
            </View>
            <Text style={styles.metricValue}>{stats?.totalListings || 0}</Text>
            <Text style={styles.metricLabel}>Bài đăng đồ cũ trên sàn</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="receipt-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>{stats?.totalOrders || 0}</Text>
            <Text style={styles.metricLabel}>Đơn đặt hàng toàn sàn</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
            </View>
            <Text style={[styles.metricValue, { color: colors.danger }]}>
              {stats?.pendingReports || 0}
            </Text>
            <Text style={styles.metricLabel}>Báo cáo cần xử lý</Text>
          </View>
        </View>

        {/* Admin Navigation Menus */}
        <Text style={styles.sectionTitle}>Chức năng Quản trị hệ thống</Text>

        <TouchableOpacity
          style={styles.adminNavCard}
          onPress={() => navigation.navigate(ROUTES.ADMIN_LISTINGS)}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.navTitle}>Kiểm duyệt bài đăng đồ cũ</Text>
            <Text style={styles.navSub}>Duyệt, từ chối hoặc tạm ẩn các bài đăng vi phạm</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminNavCard}
          onPress={() => navigation.navigate(ROUTES.ADMIN_DISPUTES)}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.navTitle}>Giải quyết khiếu nại & Trả hàng</Text>
            <Text style={styles.navSub}>Đối chiếu bản chụp tình trạng lúc mua và xử lý</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminNavCard}
          onPress={() => navigation.navigate(ROUTES.ADMIN_USERS)}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="person-remove-outline" size={24} color={colors.danger} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.navTitle}>Quản lý tài khoản người dùng</Text>
            <Text style={styles.navSub}>Khóa hoặc mở lại tài khoản có hành vi bất thường</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminNavCard}
          onPress={() => navigation.navigate(ROUTES.ADMIN_CATEGORIES)}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="options-outline" size={24} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.navTitle}>Cấu hình Schema tình trạng danh mục</Text>
            <Text style={styles.navSub}>Xem các tiêu chuẩn trường kiểm định theo danh mục</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  kpiBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  kpiBannerLabel: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  kpiBannerValue: {
    ...typography.h1,
    color: colors.textInverse,
    fontSize: 26,
    marginTop: 4,
  },
  kpiNote: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: spacing.md,
  },
  metricCard: {
    width: '50%',
    padding: 4,
  },
  metricIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    ...typography.h2,
    fontSize: 20,
  },
  metricLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginVertical: spacing.md,
  },
  adminNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  navSub: {
    ...typography.caption,
    marginTop: 2,
  },
});
