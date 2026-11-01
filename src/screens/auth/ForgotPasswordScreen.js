import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';

export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email);
      setIsSent(true);
    } catch (err) {
      Alert.alert('Không gửi được email', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Quên mật khẩu" onBackPress={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={60}
      >
        {isSent ? (
          <View style={styles.successCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>Đã gửi liên kết khôi phục</Text>
            <Text style={styles.successSubtitle}>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email {email}. Vui lòng kiểm tra hộp thư đến của bạn.
            </Text>
            <Button
              title="Quay lại Đăng nhập"
              onPress={() => navigation.goBack()}
              variant="primary"
              size="md"
              style={{ width: '100%', marginTop: spacing.lg }}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Khôi phục mật khẩu</Text>
            <Text style={styles.cardSubtitle}>
              Nhập email liên kết với tài khoản ReMarket của bạn để nhận liên kết khôi phục.
            </Text>

            <Input
              label="Địa chỉ Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nhap.email@example.com"
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
            />

            <Button
              title="Gửi liên kết khôi phục"
              onPress={handleReset}
              loading={loading}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    ...typography.h2,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    textAlign: 'center',
  },
});
