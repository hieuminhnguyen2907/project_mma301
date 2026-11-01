import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, borderRadius, typography } from '../../config/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondary, disabled && styles.disabled];
      case 'outline':
        return [styles.outline, disabled && styles.disabledOutline];
      case 'danger':
        return [styles.danger, disabled && styles.disabled];
      case 'ghost':
        return [styles.ghost];
      case 'primary':
      default:
        return [styles.primary, disabled && styles.disabled];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.textOutline, disabled && styles.textDisabled];
      case 'ghost':
        return [styles.textGhost, disabled && styles.textDisabled];
      case 'secondary':
        return [styles.textSecondary];
      case 'danger':
      case 'primary':
      default:
        return [styles.textPrimary];
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, getContainerStyle(), getSizeStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {icon}
          {/* "simple" avoids Android's highQuality line breaking dropping the last word of bold labels */}
          <Text
            textBreakStrategy="simple"
            style={[styles.textBase, getTextStyle(), icon && { marginLeft: 8 }, textStyle]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sizeLg: {
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondarySoft,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.border,
  },
  disabledOutline: {
    borderColor: colors.border,
  },
  textBase: {
    ...typography.button,
    flexShrink: 1,
    textAlign: 'center',
  },
  textPrimary: {
    color: colors.textInverse,
  },
  textSecondary: {
    color: colors.secondary,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
