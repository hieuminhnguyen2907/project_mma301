import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../config/theme';

export const DefectList = ({ defects = [], style }) => {
  if (!defects || defects.length === 0) {
    return (
      <View style={[styles.cleanContainer, style]}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text style={styles.cleanText}>
          Người bán xác nhận không có lỗi kỹ thuật đã biết.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.defectContainer, style]}>
      <View style={styles.headerRow}>
        <Ionicons name="alert-circle" size={18} color={colors.warning} />
        <Text style={styles.headerTitle}>Lỗi được người bán khai báo:</Text>
      </View>
      {defects.map((defect, index) => (
        <View key={index} style={styles.defectItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.defectText}>{defect}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cleanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cleanText: {
    ...typography.bodySmall,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  defectContainer: {
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    ...typography.subtitle,
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 6,
  },
  defectItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginLeft: 4,
  },
  bullet: {
    color: '#B45309',
    fontSize: 16,
    marginRight: 6,
    lineHeight: 18,
  },
  defectText: {
    ...typography.bodySmall,
    color: '#78350F',
    flex: 1,
    fontWeight: '500',
  },
});
