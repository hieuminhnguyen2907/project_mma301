import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../store/slices/authSlice';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { ROUTES } from '../../constants/routes';
import { imageUploadService } from '../../services/imageUploadService';
import { isValidVietnamesePhone, normalizePhone } from '../../utils/validation';

export const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(
    user?.city || user?.addresses?.find((a) => a.isDefault)?.city || user?.addresses?.[0]?.city || ''
  );
  // null = no avatar yet (a placeholder is displayed but never saved as the user's photo)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="Hồ sơ cá nhân" />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Vui lòng đăng nhập để xem thông tin cá nhân.</Text>
        </View>
      </View>
    );
  }

  const handlePickAvatar = () => {
    Alert.alert(
      'Cập nhật ảnh đại diện',
      'Bạn muốn chụp ảnh trực tiếp hay chọn ảnh từ thư viện?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: '📸 Chụp ảnh Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền máy ảnh', 'Vui lòng cấp quyền máy ảnh để chụp ảnh chân dung.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets[0]?.uri) {
              setAvatarUrl(res.assets[0].uri);
            }
          },
        },
        {
          text: '🖼️ Chọn từ Thư viện',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền thư viện', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets[0]?.uri) {
              setAvatarUrl(res.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      Alert.alert('Lỗi nhập liệu', 'Họ và tên hiển thị phải có ít nhất 2 ký tự.');
      return;
    }

    // Same rule as registration: the phone is used by buyers/sellers and shippers
    if (phoneNumber.trim() && !isValidVietnamesePhone(phoneNumber)) {
      Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập số di động Việt Nam, ví dụ 0912345678.');
      return;
    }

    setSaving(true);
    try {
      // A photo just picked is a file on this phone: upload it so others can see it
      const uploadedAvatar = avatarUrl
        ? await imageUploadService.uploadImage(avatarUrl, user.uid, 'avatars')
        : null;

      const updateData = {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() ? normalizePhone(phoneNumber) : '',
        bio: bio.trim().slice(0, 300),
        city: city.trim(),
        avatarUrl: uploadedAvatar,
      };

      await dispatch(updateUserProfile({ uid: user.uid, updateData })).unwrap();
      Alert.alert('Thành công', 'Thông tin cá nhân của bạn đã được cập nhật!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi cập nhật', String(err?.message || err || 'Không thể lưu hồ sơ vào lúc này.'));
    } finally {
      setSaving(false);
    }
  };

  const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

  return (
    <View style={styles.container}>
      <Header title="Hồ sơ cá nhân" showBack={true} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' }}
              style={styles.avatarImage}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cameraBadge}
              onPress={handlePickAvatar}
            >
              <Ionicons name="camera" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Chạm vào biểu tượng máy ảnh để đổi avatar</Text>
        </View>

        {/* Reputation & Badges Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Độ tin cậy & Đánh giá cộng đồng</Text>
          <View style={styles.reputationRow}>
            <View style={styles.repItem}>
              <Text style={styles.repValue}>
                {user.ratingCount > 0 ? `${Number(user.ratingAverage).toFixed(1)} ⭐` : 'Chưa có'}
              </Text>
              <Text style={styles.repLabel}>
                {user.ratingCount || 0} lượt đánh giá
              </Text>
            </View>
            <View style={styles.repDivider} />
            <View style={styles.repItem}>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.roleText}>
                  {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên ReMarket'}
                </Text>
              </View>
              <Text style={styles.repLabel}>
                Trạng thái: {user.status === 'suspended' ? 'Đang bị khóa' : 'Đang hoạt động'}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Form */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Thông tin cơ bản</Text>

          <Input
            label="Họ và tên hiển thị *"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nhập họ và tên đầy đủ"
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Số điện thoại liên hệ"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Ví dụ: 0912 345 678"
            maxLength={15}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Khu vực / Tỉnh, Thành phố"
            value={city}
            onChangeText={setCity}
            placeholder="Ví dụ: Hà Nội, Hồ Chí Minh, Đà Nẵng..."
            leftIcon={<Ionicons name="map-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Giới thiệu bản thân (Bio)"
            value={bio}
            onChangeText={setBio}
            placeholder="Giới thiệu đôi nét về bản thân, phong cách mua bán đồ cũ, tiêu chí trung thực..."
            multiline
            numberOfLines={3}
            maxLength={300}
            leftIcon={<Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />}
          />

          {/* Email (Readonly) */}
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Email đăng nhập (Không thể thay đổi)</Text>
            <View style={styles.readonlyBox}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <Text style={styles.readonlyValue}>{user.email}</Text>
              <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
            </View>
          </View>
        </View>

        {/* Address Shortcut Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Địa chỉ nhận hàng mặc định</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(ROUTES.ADDRESS_MANAGER)}
              style={styles.manageAddressBtn}
            >
              <Text style={styles.manageAddressText}>Sửa sổ địa chỉ</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {defaultAddr ? (
            <View style={styles.addressPreview}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.addrName}>
                  {defaultAddr.recipientName} ({defaultAddr.phoneNumber})
                </Text>
                <Text style={styles.addrStreet}>{defaultAddr.street || defaultAddr.streetAddress}</Text>
                <Text style={styles.addrCity}>
                  {[defaultAddr.ward, defaultAddr.district, defaultAddr.city].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressPrompt}
              onPress={() => navigation.navigate(ROUTES.ADDRESS_MANAGER)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addAddressPromptText}>Chưa có địa chỉ nào. Bấm để thêm mới.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save Button */}
        <Button
          title={saving ? 'Đang lưu thông tin...' : 'Lưu thay đổi hồ sơ'}
          variant="primary"
          size="lg"
          onPress={handleSaveProfile}
          disabled={saving}
          style={styles.saveBtn}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 20,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.borderLight,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardHeader: {
    ...typography.h3,
    fontSize: 15,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  manageAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageAddressText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  repItem: {
    flex: 1,
    alignItems: 'center',
  },
  repValue: {
    ...typography.h3,
    color: colors.accent,
    fontWeight: '800',
  },
  repLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  repDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  readonlyField: {
    marginTop: spacing.xs,
  },
  readonlyLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  readonlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readonlyValue: {
    flex: 1,
    marginLeft: 10,
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  addrName: {
    ...typography.subtitle,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textPrimary,
  },
  addrStreet: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addrCity: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addAddressPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  addAddressPromptText: {
    ...typography.body,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
