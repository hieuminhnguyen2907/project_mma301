import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { disputeService, RETURN_REASON_LABELS, RETURN_WINDOW_DAYS } from '../../services/disputeService';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography, borderRadius } from '../../config/theme';

export const CreateReturnScreen = ({ route, navigation }) => {
  const { order } = route.params || {};
  const { user } = useSelector((state) => state.auth);

  const [selectedReason, setSelectedReason] = useState('defect_not_declared');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = Object.entries(RETURN_REASON_LABELS).map(([key, label]) => ({ key, label }));

  const handleSubmit = async () => {
    if (loading) return;
    if (explanation.trim().length < 15) {
      Alert.alert('Nhắc nhở', 'Vui lòng mô tả chi tiết lý do yêu cầu trả hàng ít nhất 15 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await disputeService.submitReturnRequest({
        order,
        buyer: user,
        reason: selectedReason,
        explanation: explanation.trim(),
      });

      Alert.alert(
        'Đã gửi yêu cầu',
        'Yêu cầu trả hàng & khiếu nại của bạn đã được chuyển cho Quản trị viên ReMarket giải quyết.',
        [{ text: 'Đóng', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Yêu cầu trả hàng / Khiếu nại" onBackPress={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Đơn hàng: {order?.orderNumber}</Text>
          <Text style={styles.subtitle}>
            ReMarket sẽ đối chiếu mô tả của bạn với bản chụp tình trạng người bán đã khai báo lúc bạn đặt hàng. Yêu cầu cần gửi trong vòng {RETURN_WINDOW_DAYS} ngày kể từ khi nhận hàng; quản trị viên có thể liên hệ để xin thêm ảnh bằng chứng qua tin nhắn.
          </Text>

          <Text style={styles.sectionLabel}>Lý do khiếu nại *</Text>
          {reasons.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.reasonPill,
                selectedReason === r.key && styles.reasonPillSelected,
              ]}
              onPress={() => setSelectedReason(r.key)}
            >
              <View
                style={[
                  styles.radioDot,
                  selectedReason === r.key && styles.radioDotSelected,
                ]}
              />
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === r.key && styles.reasonTextSelected,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}

          <Input
            label="Mô tả chi tiết sự khác biệt *"
            value={explanation}
            onChangeText={setExplanation}
            placeholder="Mô tả rõ lỗi thực tế so với bản mô tả người bán đã cam kết..."
            multiline
            numberOfLines={5}
            maxLength={1000}
            style={{ marginTop: spacing.md }}
          />

          <Button
            title="Gửi yêu cầu Trả hàng"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </KeyboardAwareScrollView>
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
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    ...typography.h3,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.subtitle,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  reasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  reasonPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    marginRight: 10,
  },
  radioDotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reasonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
