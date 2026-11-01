import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../config/theme';

export const Badge = ({
  label,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size = 'md',        // 'sm' | 'md'
  icon,
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successSoft, text: colors.success };
      case 'warning':
        return { bg: colors.warningSoft, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerSoft, text: colors.danger };
      case 'info':
        return { bg: colors.infoSoft, text: colors.info };
      case 'neutral':
        return { bg: colors.borderLight, text: colors.textSecondary };
      case 'primary':
      default:
        return { bg: colors.primarySoft, text: colors.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        style,
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' ? styles.textSm : styles.textMd,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.pill,
  },
  sizeSm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  sizeMd: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
