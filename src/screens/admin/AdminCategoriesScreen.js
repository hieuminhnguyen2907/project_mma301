import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { Header } from '../../components/common/Header';
import { colors, spacing, typography, borderRadius } from '../../config/theme';

export const AdminCategoriesScreen = ({ navigation }) => {
  const { categories } = useSelector((state) => state.products);

  return (
    <View style={styles.container}>
      <Header title="Cấu hình Schema Tình trạng" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          Mỗi danh mục được phân chia thành các phân loại sản phẩm cụ thể, kèm biểu mẫu kiểm định tình trạng chuẩn hóa riêng để không bị nhầm lẫn giữa các dòng sản phẩm.
        </Text>

        {categories.map((cat) => (
          <View key={cat.id} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.iconCircle}>
                <Ionicons name={cat.icon || 'grid-outline'} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catSlug}>
                  slug: {cat.slug} • {cat.subCategories?.length || 0} phân loại chuẩn hóa
                </Text>
              </View>
            </View>

            {cat.subCategories && cat.subCategories.length > 0 ? (
              <View style={styles.subCatSection}>
                <Text style={styles.subCatHeader}>
                  Phân loại chi tiết & Tiêu chuẩn thẩm định ({cat.subCategories.length}):
                </Text>

                {cat.subCategories.map((sub) => (
                  <View key={sub.id} style={styles.subCatCard}>
                    <View style={styles.subCatHeaderRow}>
                      <Ionicons name={sub.icon || 'pricetag-outline'} size={15} color={colors.primary} />
                      <Text style={styles.subCatName}>{sub.name}</Text>
                    </View>
                    {Boolean(sub.description) && (
                      <Text style={styles.subCatDesc}>{sub.description}</Text>
                    )}

                    <View style={styles.fieldList}>
                      {sub.conditionFieldSchema?.map((field, idx) => (
                        <View key={idx} style={styles.fieldItem}>
                          <Text style={styles.fieldName}>
                            {idx + 1}. {field.label} ({field.type})
                            {field.required ? ' *' : ''}
                          </Text>
                          {field.options && (
                            <Text style={styles.fieldOptions}>
                              Tùy chọn: {field.options.join(' | ')}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.fieldsHeader}>
                  Các trường thuộc tính khai báo ({cat.conditionFieldSchema?.length || 0}):
                </Text>

                {cat.conditionFieldSchema?.map((field, idx) => (
                  <View key={idx} style={styles.fieldItem}>
                    <Text style={styles.fieldName}>
                      {idx + 1}. {field.label} ({field.type})
                      {field.required ? ' *' : ''}
                    </Text>
                    {field.options && (
                      <Text style={styles.fieldOptions}>
                        Tùy chọn: {field.options.join(' | ')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  intro: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    ...typography.subtitle,
    fontWeight: '700',
  },
  catSlug: {
    ...typography.caption,
    color: colors.textMuted,
  },
  subCatSection: {
    marginTop: spacing.xs,
  },
  subCatHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  subCatCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subCatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subCatName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subCatDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
    fontSize: 11,
  },
  fieldList: {
    marginTop: 4,
  },
  fieldsHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
    marginBottom: 4,
  },
  fieldItem: {
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  fieldName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fieldOptions: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
