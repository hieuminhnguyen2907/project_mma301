import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../config/theme';

export const Card = ({
  children,
  onPress,
  style,
  elevation = 'sm', // 'none' | 'sm' | 'md' | 'lg'
  bordered = true,
}) => {
  const containerStyles = [
    styles.card,
    bordered && styles.bordered,
    elevation !== 'none' && shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={containerStyles}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
