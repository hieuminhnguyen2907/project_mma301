import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { disputeService } from '../../services/disputeService';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography, borderRadius } from '../../config/theme';

export const CreateReportScreen = ({ route, navigation }) => {
  const { targetType = 'product', targetId, targetName, targetOwnerId } = route.params || {};
  const { user } = useSelector((state) => state.auth);

  const [selectedReason, setSelectedReason] = useState('misleading_condition');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    { key: 'misleading_condition', label: 'Thông tin tình trạng sai lệch / che giấu lỗi' },
    { key: 'counterfeit', label: 'Hàng giả / Nhái / Không rõ nguồn gốc' },
    { key: 'prohibited_item', label: 'Hàng cấm mua bán theo quy định pháp luật' },
    { key: 'scam_behavior', label: 'Có dấu hiệu lừa đảo / ép chuyển khoản ngoài app' },
    { key: 'other', label: 'Lý do khác' },
  ];

  const handleSubmit = async () => {
    if (loading) return;
    if (description.trim().length < 15) {
      Alert.alert('Nhắc nhở', 'Vui lòng mô tả chi tiết vi phạm tối thiểu 15 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await disputeService.submitReport({
        reporter: user,
        targetType,
        targetId,
        targetName,
        targetOwnerId,
        reason: selectedReason,
        description: description.trim(),
      });

      Alert.alert(
        'Đã gửi báo cáo',
        'Quản trị viên ReMarket sẽ kiểm duyệt nội dung và áp dụng biện pháp xử lý thích hợp.',
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
      <Header title="Báo cáo vi phạm" onBackPress={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Báo cáo: {targetName || 'Đối tượng vi phạm'}</Text>
          <Text style={styles.subtitle}>
            Giúp xây dựng môi trường mua bán đồ cũ minh bạch bằng cách phản ánh các bài đăng hoặc người bán vi phạm tiêu chuẩn cộng đồng.
          </Text>

          <Text style={styles.sectionLabel}>Chọn lý do báo cáo *</Text>
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
            label="Mô tả cụ thể vi phạm *"
            value={description}
            onChangeText={setDescription}
            placeholder="Cung cấp các bằng chứng hoặc mô tả những điểm bất thường bạn phát hiện..."
            multiline
            numberOfLines={5}
            maxLength={1000}
            style={{ marginTop: spacing.md }}
          />

          <Button
            title="Gửi báo cáo cho Quản trị viên"
            variant="danger"
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
