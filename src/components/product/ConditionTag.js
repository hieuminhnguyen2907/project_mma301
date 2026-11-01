import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius } from '../../config/theme';

export const ConditionTag = ({ condition, size = 'sm', style }) => {
  const getBadgeConfig = () => {
    switch (condition) {
      case 'Like New':
        return { label: 'Như mới', bg: '#D1FAE5', text: '#059669' };
      case 'Very Good':
        return { label: 'Rất tốt', bg: '#CCFBF1', text: '#0F766E' };
      case 'Good':
        return { label: 'Tốt', bg: '#DBEAFE', text: '#2563EB' };
      case 'Acceptable':
        return { label: 'Chấp nhận được', bg: '#FEF3C7', text: '#D97706' };
      case 'Needs Repair':
        return { label: 'Cần sửa chữa', bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { label: condition || 'Đã qua sử dụng', bg: '#F1F5F9', text: '#475569' };
    }
  };

  const { label, bg, text } = getBadgeConfig();

  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: bg },
        size === 'md' ? styles.tagMd : styles.tagSm,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'md' ? styles.textMd : styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  tagSm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  tagMd: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
    lineHeight: 14,
  },
  textMd: {
    fontSize: 12,
    lineHeight: 16,
  },
});
