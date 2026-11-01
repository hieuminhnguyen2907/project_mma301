import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { reviewService } from '../../services/reviewService';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StarRating } from '../../components/common/StarRating';
import { colors, spacing, typography, borderRadius } from '../../config/theme';

export const CreateReviewScreen = ({ route, navigation }) => {
  const { order } = route.params || {};
  const { user } = useSelector((state) => state.auth);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const firstItem = order?.items?.[0];

  const handleSubmit = async () => {
    if (submitting) return;
    if (comment.trim().length < 10) {
      Alert.alert('Nhắc nhở', 'Vui lòng viết nhận xét tối thiểu 10 ký tự về chất lượng món đồ và người bán.');
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.submitReview({
        orderId: order.id,
        rating,
        comment: comment.trim(),
        buyer: user,
      });

      Alert.alert('Cảm ơn bạn!', 'Đánh giá của bạn đã được ghi nhận và cập nhật vào hồ sơ người bán.', [
        { text: 'Xong', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Đánh giá người bán" onBackPress={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Snapshot Card */}
        {firstItem && (
          <View style={styles.productCard}>
            <Image source={{ uri: firstItem.primaryImage }} style={styles.thumb} />
            <View style={styles.productInfo}>
              <Text numberOfLines={2} style={styles.productName}>
                {firstItem.productName}
              </Text>
              <Text style={styles.sellerName}>Người bán: {order.sellerName}</Text>
            </View>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.title}>Bạn cảm thấy thế nào về món đồ này?</Text>
          <Text style={styles.subtitle}>
            Tình trạng sản phẩm thực tế có đúng với những gì người bán đã khai báo không?
          </Text>

          <View style={styles.starSection}>
            <StarRating
              rating={rating}
              interactive
              size={36}
              onRatingChange={setRating}
            />
            <Text style={styles.ratingLabelText}>
              {rating === 5
                ? 'Tuyệt vời - Đúng như mô tả'
                : rating === 4
                ? 'Hài lòng'
                : rating === 3
                ? 'Bình thường'
                : rating === 2
                ? 'Chưa hài lòng'
                : 'Kém - Sai lệch mô tả'}
            </Text>
          </View>

          <Input
            label="Nhận xét chi tiết *"
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ về độ trung thực của thông tin, đóng gói, thái độ người bán..."
            multiline
            numberOfLines={5}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.trim().length}/500</Text>

          <Button
            title="Gửi đánh giá"
            variant="primary"
            size="lg"
            loading={submitting}
            onPress={handleSubmit}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  charCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: -6,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    ...typography.body,
    fontWeight: '700',
  },
  sellerName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  starSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ratingLabelText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
  },
});
