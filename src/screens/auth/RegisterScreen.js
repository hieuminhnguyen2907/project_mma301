import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { registerSchema } from '../../utils/validation';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { ROUTES } from '../../constants/routes';

export const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: null }));
    }
    if (error) dispatch(clearAuthError());
  };

  const handleRegister = async () => {
    setFormErrors({});

    // Validate with Zod schema
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      await dispatch(registerUser(form)).unwrap();
      Alert.alert('Thành công', 'Chào mừng bạn đến với cộng đồng mua bán ReMarket!', [
        { text: 'Bắt đầu', onPress: () => navigation.navigate(ROUTES.APP_TABS) },
      ]);
    } catch (err) {
      // Error in slice
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Tạo tài khoản" onBackPress={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={70}
      >
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Tham gia ReMarket</Text>
          <Text style={styles.introSubtitle}>
            Tài khoản cho phép bạn vừa mua vừa bán đồ cũ an toàn và tiện lợi.
          </Text>
        </View>

        {error && (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Input
            label="Họ và tên"
            value={form.displayName}
            onChangeText={(t) => handleChange('displayName', t)}
            placeholder="Ví dụ: Nguyễn Văn An"
            error={formErrors.displayName}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Địa chỉ Email"
            value={form.email}
            onChangeText={(t) => handleChange('email', t)}
            placeholder="email@example.com"
            keyboardType="email-address"
            error={formErrors.email}
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Số điện thoại"
            value={form.phoneNumber}
            onChangeText={(t) => handleChange('phoneNumber', t)}
            placeholder="0912345678"
            keyboardType="phone-pad"
            error={formErrors.phoneNumber}
            leftIcon={<Ionicons name="call-outline" size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Mật khẩu"
            value={form.password}
            onChangeText={(t) => handleChange('password', t)}
            placeholder="Tối thiểu 6 ký tự"
            secureTextEntry
            error={formErrors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Xác nhận mật khẩu"
            value={form.confirmPassword}
            onChangeText={(t) => handleChange('confirmPassword', t)}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            error={formErrors.confirmPassword}
            leftIcon={<Ionicons name="checkmark-done-outline" size={18} color={colors.textSecondary} />}
          />

          <Button
            title="Đăng ký tài khoản"
            onPress={handleRegister}
            loading={isLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* One paragraph so Android wraps the bold link instead of clipping its last word */}
        <Text style={styles.footer} textBreakStrategy="simple">
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
            suppressHighlighting
          >
            Đăng nhập
          </Text>
        </Text>
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
    padding: spacing.lg,
  },
  introBox: {
    marginBottom: spacing.lg,
  },
  introTitle: {
    ...typography.h2,
    color: colors.primary,
  },
  introSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 4,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorAlertText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  footerText: {
    ...typography.bodySmall,
  },
  loginLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});
