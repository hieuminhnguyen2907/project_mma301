import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addDeliveryAddress, setDefaultAddress } from '../../store/slices/authSlice';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { isValidVietnamesePhone, normalizePhone } from '../../utils/validation';

export const AddressManagerScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    recipientName: '',
    phoneNumber: '',
    street: '',
    ward: '',
    district: '',
    city: 'Hồ Chí Minh',
  });

  const addresses = user?.addresses || [];

  const handleAddAddress = async () => {
    if (saving) return;
    if (
      form.recipientName.trim().length < 2 ||
      form.street.trim().length < 3 ||
      form.district.trim().length < 2 ||
      form.city.trim().length < 2
    ) {
      Alert.alert(
        'Nhắc nhở',
        'Vui lòng điền đầy đủ tên người nhận, số nhà/tên đường, quận/huyện và tỉnh/thành phố để shipper giao được hàng.'
      );
      return;
    }

    // The shipper calls this number, so it has to be a real VN mobile number
    if (!isValidVietnamesePhone(form.phoneNumber)) {
      Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập số di động Việt Nam, ví dụ 0912345678.');
      return;
    }

    const addressData = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    addressData.phoneNumber = normalizePhone(form.phoneNumber);

    setSaving(true);
    try {
      await dispatch(
        addDeliveryAddress({ uid: user.uid, addressData })
      ).unwrap();
      setModalVisible(false);
      setForm({
        recipientName: '',
        phoneNumber: '',
        street: '',
        ward: '',
        district: '',
        city: 'Hồ Chí Minh',
      });
      Alert.alert('Thành công', 'Đã thêm địa chỉ giao hàng mới.');
    } catch (err) {
      Alert.alert('Lỗi', String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await dispatch(setDefaultAddress({ uid: user.uid, addressId })).unwrap();
    } catch (err) {
      Alert.alert('Lỗi', String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Sổ địa chỉ"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
            <Button
              title="+ Thêm địa chỉ mới"
              variant="primary"
              size="md"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.isDefault && styles.defaultCard]}>
            <View style={styles.topRow}>
              <Text style={styles.name} numberOfLines={1}>{item.recipientName}</Text>
              <Text style={styles.phone}>{item.phoneNumber}</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>MẶC ĐỊNH</Text>
                </View>
              )}
            </View>
            <Text style={styles.address}>
              {[item.street, item.ward, item.district, item.city].filter(Boolean).join(', ')}
            </Text>

            {!item.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(item.id)}
              >
                <Text style={styles.setDefaultText}>Đặt làm địa chỉ mặc định</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Add Address Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Thêm địa chỉ nhận hàng"
        scrollable
      >
        <Input
          label="Tên người nhận *"
          value={form.recipientName}
          onChangeText={(t) => setForm((p) => ({ ...p, recipientName: t }))}
          placeholder="Ví dụ: Nguyễn Văn An"
        />
        <Input
          label="Số điện thoại *"
          value={form.phoneNumber}
          onChangeText={(t) => setForm((p) => ({ ...p, phoneNumber: t }))}
          placeholder="0912345678"
          keyboardType="phone-pad"
        />
        <Input
          label="Số nhà, tên đường *"
          value={form.street}
          onChangeText={(t) => setForm((p) => ({ ...p, street: t }))}
          placeholder="123 Nguyễn Trãi"
        />
        <Input
          label="Phường / Xã"
          value={form.ward}
          onChangeText={(t) => setForm((p) => ({ ...p, ward: t }))}
          placeholder="Phường 2"
        />
        <Input
          label="Quận / Huyện *"
          value={form.district}
          onChangeText={(t) => setForm((p) => ({ ...p, district: t }))}
          placeholder="Quận 5"
        />
        <Input
          label="Tỉnh / Thành phố *"
          value={form.city}
          onChangeText={(t) => setForm((p) => ({ ...p, city: t }))}
          placeholder="Hồ Chí Minh"
        />

        <Button
          title="Lưu địa chỉ"
          variant="primary"
          size="md"
          loading={saving}
          onPress={handleAddAddress}
          style={{ marginTop: spacing.sm }}
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
  listContent: {
    padding: spacing.md,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 40,
  },
  emptyTitle: {
    ...typography.subtitle,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  defaultCard: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDFA',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  phone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  defaultBadgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
  address: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  setDefaultBtn: {
    marginTop: spacing.sm,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  setDefaultText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
