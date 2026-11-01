import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { ROUTES } from '../../constants/routes';

export const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleLogin = async () => {
    setValidationError('');
    if (!email.trim() || !password) {
      setValidationError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      await dispatch(loginUser({ email: email.trim(), password })).unwrap();
      // Leave the auth flow: back to the screen that asked for login, else to the tabs
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(ROUTES.APP_TABS);
      }
    } catch (err) {
      // Error handled in slice
    }
  };

  const handleGuestContinue = () => {
    navigation.navigate(ROUTES.APP_TABS);
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top > 0 ? insets.top + 10 : Platform.OS === 'android' ? 36 : 20,
            paddingBottom: 60,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={60}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Chợ Đồ Cũ ReMarket</Text>
          <Text style={styles.brandSubtitle}>
            Mua bán & trao đổi đồ cũ minh bạch - an tâm
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formCard}>

          {(validationError || error) && (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorAlertText}>{validationError || error}</Text>
            </View>
          )}

          <Input
            label="Địa chỉ Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) dispatch(clearAuthError());
            }}
            placeholder="nhap.email@example.com"
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Mật khẩu"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) dispatch(clearAuthError());
            }}
            placeholder="Tối thiểu 6 ký tự"
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button
            title="Đăng nhập"
            onPress={handleLogin}
            loading={isLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />

          {/* Guest Browsing */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleGuestContinue}
          >
            <Text style={styles.guestBtnText}>
              Duyệt xem chợ với tư cách Khách (Guest) →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link to Register */}
        {/* One paragraph so Android wraps the bold link instead of clipping its last word */}
        <Text style={styles.footer} textBreakStrategy="simple">
          <Text style={styles.footerText}>Chưa có tài khoản ReMarket? </Text>
          <Text
            style={styles.registerLink}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
            suppressHighlighting
          >
            Đăng ký ngay
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: spacing.sm,
  },
  brandTitle: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 28,
  },
  brandSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: spacing.lg,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  guestBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  footerText: {
    ...typography.bodySmall,
  },
  registerLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});
