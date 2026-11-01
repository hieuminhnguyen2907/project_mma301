import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { disputeService } from '../../services/disputeService';
import { productService } from '../../services/productService';
import { adminService } from '../../services/adminService';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { formatDate } from '../../utils/date';

export const AdminDisputesScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [returns, setReturns] = useState([]);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'returns'
  const [refreshing, setRefreshing] = useState(false);
  const { user: admin } = useSelector((state) => state.auth);

  const STATUS_LABELS = {
    pending: 'CHỜ XỬ LÝ',
    resolved: 'ĐÃ XỬ LÝ',
    dismissed: 'ĐÃ BỎ QUA',
    submitted: 'CHỜ XỬ LÝ',
    under_review: 'ĐANG XEM XÉT',
    approved: 'CHẤP NHẬN',
    rejected: 'TỪ CHỐI',
  };

  const logAction = (action, targetType, targetId, reason) =>
    adminService.logModerationAction({
      adminId: admin?.uid,
      adminEmail: admin?.email,
      action,
      targetType,
      targetId,
      reason,
    });

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [reps, rets] = await Promise.all([
        disputeService.getAllReports(),
        disputeService.getAllReturnRequests(),
      ]);
      setReports(reps);
      setReturns(rets);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveReport = async (report) => {
    Alert.alert(
      'Xử lý báo cáo',
      `Giải quyết báo cáo cho đối tượng: ${report.targetName}?`,
      [
        { text: 'Hủy' },
        {
          text: 'Bỏ qua (Dismiss)',
          onPress: async () => {
            try {
              await disputeService.resolveReport(report.id, 'dismissed', 'Báo cáo không có căn cứ', admin?.uid);
              await logAction('DISMISS_REPORT', 'report', report.id, 'Báo cáo không có căn cứ');
              loadData();
            } catch (err) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
        {
          text: 'Ẩn sản phẩm & Cảnh cáo',
          style: 'destructive',
          onPress: async () => {
            try {
              // The action label promises the listing gets hidden, so actually hide it
              if (report.targetType === 'product' && report.targetId) {
                await productService.moderateProduct(report.targetId, 'hide', 'Vi phạm chính sách khai báo');
                await logAction('HIDE_LISTING', 'product', report.targetId, 'Vi phạm chính sách khai báo');
              }
              await disputeService.resolveReport(report.id, 'listing_hidden', 'Nội dung vi phạm chính sách khai báo', admin?.uid);
              await logAction('RESOLVE_REPORT', 'report', report.id, 'Ẩn sản phẩm & cảnh cáo');
              loadData();
            } catch (err) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  const handleResolveReturn = (ret) => {
    const decide = async (decision, note) => {
      try {
        await disputeService.resolveReturnRequest(ret.id, decision, note, admin?.uid);
        await logAction('RESOLVE_DISPUTE', 'dispute', ret.id, `${decision}: ${note}`);
        loadData();
      } catch (err) {
        Alert.alert('Lỗi', err.message);
      }
    };
    Alert.alert(
      'Xử lý yêu cầu trả hàng',
      `Đơn ${ret.orderNumber} - ${ret.reasonLabel || ret.reason}\n\n"${ret.explanation}"`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: () => decide('rejected', 'Chưa đủ căn cứ cho thấy sản phẩm sai khác với khai báo.'),
        },
        {
          text: 'Chấp nhận trả hàng',
          onPress: () => decide('approved', 'Người bán liên hệ nhận lại hàng và hoàn tiền cho người mua.'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Giải quyết Tranh chấp & Khiếu nại" onBackPress={() => navigation.goBack()} />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reports' && styles.tabBtnActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Báo cáo vi phạm ({reports.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'returns' && styles.tabBtnActive]}
          onPress={() => setActiveTab('returns')}
        >
          <Text style={[styles.tabText, activeTab === 'returns' && styles.tabTextActive]}>
            Yêu cầu trả hàng ({returns.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'reports' ? (
        reports.length === 0 ? (
          <EmptyState title="Không có báo cáo vi phạm nào" subtitle="Mọi giao dịch trên sàn đều đang diễn ra bình thường." />
        ) : (
          <FlatList
            data={reports}
            refreshing={refreshing}
            onRefresh={loadData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.targetName}>{item.targetName}</Text>
                  <Text style={[styles.statusBadge, item.status === 'pending' ? styles.statusPending : styles.statusResolved]}>
                    {STATUS_LABELS[item.status] || item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.reporter}>Người báo cáo: {item.reporterName}</Text>
                <Text style={styles.reason}>Lý do: {item.reasonLabel || item.reason}</Text>
                <Text style={styles.desc}>"{item.description}"</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

                {item.status === 'pending' && (
                  <Button
                    title="Xử lý báo cáo này"
                    variant="primary"
                    size="sm"
                    onPress={() => handleResolveReport(item)}
                    style={{ marginTop: spacing.sm }}
                  />
                )}
              </View>
            )}
          />
        )
      ) : (
        returns.length === 0 ? (
          <EmptyState title="Không có yêu cầu trả hàng" subtitle="Chưa có khách hàng nào gửi khiếu nại hoàn tiền." />
        ) : (
          <FlatList
            data={returns}
            refreshing={refreshing}
            onRefresh={loadData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isOpen = item.status === 'submitted' || item.status === 'under_review';
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.targetName}>Đơn hàng: {item.orderNumber}</Text>
                    <Text style={[styles.statusBadge, isOpen ? styles.statusPending : styles.statusResolved]}>
                      {STATUS_LABELS[item.status] || item.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.reporter}>Người mua: {item.buyerName} • Người bán: {item.sellerName}</Text>
                  <Text style={styles.reason}>Lý do: {item.reasonLabel || item.reason}</Text>
                  <Text style={styles.desc}>"{item.explanation}"</Text>
                  {item.adminResolution?.explanation ? (
                    <Text style={styles.reporter}>Kết quả: {item.adminResolution.explanation}</Text>
                  ) : null}
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

                  {isOpen && (
                    <Button
                      title="Xử lý yêu cầu này"
                      variant="primary"
                      size="sm"
                      onPress={() => handleResolveReturn(item)}
                      style={{ marginTop: spacing.sm }}
                    />
                  )}
                </View>
              );
            }}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetName: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statusResolved: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  reporter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  reason: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.danger,
    marginTop: 4,
  },
  desc: {
    ...typography.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  date: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
});
