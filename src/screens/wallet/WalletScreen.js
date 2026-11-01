import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { walletService } from '../../services/walletService.js';
import { Header } from '../../components/common/Header.js';
import { Button } from '../../components/common/Button.js';
import { Modal } from '../../components/common/Modal.js';
import { Input } from '../../components/common/Input.js';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme.js';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';

export const WalletScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Withdraw Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(user?.displayName || '');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadWallet = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await walletService.getWallet(user.uid);
      setWallet(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user]);

  const banks = ['Vietcombank', 'MB Bank', 'Techcombank', 'VPBank', 'ACB', 'BIDV'];

  const handleConfirmWithdrawal = async () => {
    const num = parseCurrencyInput(withdrawAmount);
    if (!num || num < 50000) {
      Alert.alert('Nhắc nhở', 'Số tiền rút tối thiểu là 50.000 ₫');
      return;
    }

    if (num > (wallet?.availableBalance || 0)) {
      Alert.alert('Không đủ số dư', `Số dư khả dụng hiện tại là ${formatCurrency(wallet?.availableBalance || 0)}.`);
      return;
    }

    if (!/^\d{6,20}$/.test(accountNumber.replace(/\s/g, ''))) {
      Alert.alert('Nhắc nhở', 'Số tài khoản ngân hàng chỉ gồm 6-20 chữ số');
      return;
    }

    if (accountHolder.trim().length < 2) {
      Alert.alert('Nhắc nhở', 'Vui lòng nhập tên chủ tài khoản');
      return;
    }

    setWithdrawing(true);
    try {
      await walletService.requestWithdrawal({
        userId: user.uid,
        amount: num,
        bankName,
        accountNumber,
        accountHolder,
      });

      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      setAccountNumber('');
      Alert.alert(
        'Đã ghi nhận yêu cầu rút tiền',
        `Yêu cầu rút ${formatCurrency(num)} về ${bankName} đang chờ xử lý (thường trong 1-3 ngày làm việc). Số tiền này đã được tạm giữ khỏi số dư khả dụng.`
      );
      loadWallet();
    } catch (err) {
      Alert.alert('Lỗi rút tiền', err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Ví tiền & Doanh thu" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadWallet} colors={[colors.primary]} />
        }
      >
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SỐ DƯ KHẢ DỤNG</Text>
          <Text style={styles.balanceValue}>
            {wallet ? formatCurrency(wallet.availableBalance || 0) : '—'}
          </Text>

          <View style={styles.pendingRow}>
            <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.pendingText}>
              Đang chờ quyết toán (đơn đang giao):{' '}
              <Text style={{ fontWeight: '700' }}>
                {formatCurrency(wallet?.pendingSettlement || 0)}
              </Text>
            </Text>
          </View>

          <Button
            title="Rút tiền về tài khoản ngân hàng"
            variant="secondary"
            size="md"
            onPress={() => setWithdrawModalVisible(true)}
            style={styles.withdrawBtn}
          />
        </View>

        {/* Info callout */}
        <View style={styles.infoCallout}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Tiền hàng của đơn COD được cộng vào số dư khả dụng sau khi người mua xác nhận đã nhận hàng (phí vận chuyển không tính vào doanh thu).
          </Text>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Lịch sử biến động số dư</Text>

        {wallet?.transactions?.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có giao dịch biến động số dư nào</Text>
          </View>
        ) : (
          wallet?.transactions?.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View
                style={[
                  styles.txIconCircle,
                  tx.amount > 0 ? styles.txIconPlus : styles.txIconMinus,
                ]}
              >
                <Ionicons
                  name={tx.amount > 0 ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={tx.amount > 0 ? colors.success : colors.danger}
                />
              </View>

              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txTime}>
                  {formatDate(tx.timestamp)}
                  {tx.status === 'PENDING' ? ' • Đang xử lý' : ''}
                </Text>
              </View>

              <Text
                style={[
                  styles.txAmount,
                  tx.amount > 0 ? styles.txAmountPlus : styles.txAmountMinus,
                ]}
              >
                {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        title="Rút tiền về Ngân hàng"
        scrollable
      >
        <Text style={styles.modalSub}>
          Số dư khả dụng: <Text style={{ fontWeight: '700', color: colors.primary }}>{formatCurrency(wallet?.availableBalance || 0)}</Text>
        </Text>

        <Input
          label="Số tiền cần rút (VND) *"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          placeholder="Tối thiểu 50.000"
          keyboardType="numeric"
          formatNumber={true}
        />

        <Text style={styles.inputLabel}>Chọn ngân hàng *</Text>
        <View style={styles.banksRow}>
          {banks.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.bankPill, bankName === b && styles.bankPillActive]}
              onPress={() => setBankName(b)}
            >
              <Text style={[styles.bankPillText, bankName === b && styles.bankPillTextActive]}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Số tài khoản ngân hàng *"
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="Ví dụ: 10182910291"
          keyboardType="number-pad"
          maxLength={20}
        />

        <Input
          label="Tên chủ tài khoản *"
          value={accountHolder}
          onChangeText={setAccountHolder}
          placeholder="NGUYEN VAN A"
          autoCapitalize="characters"
        />

        <Button
          title="Xác nhận rút tiền"
          variant="primary"
          size="lg"
          loading={withdrawing}
          onPress={handleConfirmWithdrawal}
          style={{ marginTop: spacing.md }}
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  balanceLabel: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  balanceValue: {
    ...typography.h1,
    color: colors.textInverse,
    fontSize: 28,
    marginTop: 4,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pendingText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 6,
  },
  withdrawBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginTop: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconPlus: {
    backgroundColor: colors.successSoft,
  },
  txIconMinus: {
    backgroundColor: colors.dangerSoft,
  },
  txInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txDesc: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  txTime: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    ...typography.subtitle,
    fontWeight: '700',
  },
  txAmountPlus: {
    color: colors.success,
  },
  txAmountMinus: {
    color: colors.danger,
  },
  modalSub: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  banksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  bankPill: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  bankPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  bankPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bankPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
