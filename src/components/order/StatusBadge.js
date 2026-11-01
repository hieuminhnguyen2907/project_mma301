import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ORDER_STATUS_DETAILS } from '../../constants/orderStatus';
import { borderRadius } from '../../config/theme';

export const StatusBadge = ({ status, size = 'md', style }) => {
  const details = ORDER_STATUS_DETAILS[status] || {
    label: status,
    color: '#64748B',
    bgColor: '#F1F5F9',
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: details.bgColor },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: details.color },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {details.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  sizeMd: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
});
