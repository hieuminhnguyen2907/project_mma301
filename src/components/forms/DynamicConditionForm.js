import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../config/theme';
import { formatNumberWithDots } from '../../utils/currency';

export const DynamicConditionForm = ({
  category,
  selectedSubCategoryId,
  onSelectSubCategory,
  formData = {},
  onChangeField,
  errors = {},
  style,
}) => {
  // Empty state when user hasn't selected a category yet
  if (!category) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Chưa chọn danh mục sản phẩm</Text>
        <Text style={styles.emptySubtitle}>
          Vui lòng chụp/tải ảnh sản phẩm để AI tự động nhận diện danh mục, hoặc bấm chọn một danh mục ở mục 2 bên trên để hệ thống hiển thị biểu mẫu thẩm định phù hợp.
        </Text>
      </View>
    );
  }

  // Determine active sub-category & active condition schema. No product type is picked
  // on the seller's behalf: the questions depend on it, so they appear only once the
  // seller (or the AI) has chosen the type.
  const subCategories = category.subCategories || [];
  const hasSubCategories = subCategories.length > 0;

  const activeSubCategory = hasSubCategories
    ? subCategories.find((s) => s.id === selectedSubCategoryId) || null
    : null;

  const activeSchema = activeSubCategory
    ? activeSubCategory.conditionFieldSchema
    : hasSubCategories
    ? []
    : category.conditionFieldSchema || [];

  // Optional single-choice answers can be cleared by tapping them again
  const handleSelectOption = (field, option) => {
    if (!field.required && formData[field.fieldKey] === option) {
      onChangeField(field.fieldKey, undefined);
      return;
    }
    onChangeField(field.fieldKey, option);
  };

  const handleToggleMultiSelect = (fieldKey, option) => {
    const currentList = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    if (currentList.includes(option)) {
      onChangeField(
        fieldKey,
        currentList.filter((item) => item !== option)
      );
    } else {
      onChangeField(fieldKey, [...currentList, option]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Category & Section Header */}
      <View style={styles.headerBlock}>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name={category.icon || 'grid-outline'} size={14} color={colors.primary} />
            <Text style={styles.categoryBadgeText}>{category.name}</Text>
          </View>
          {activeSubCategory && (
            <View style={styles.subCatActiveBadge}>
              <Text style={styles.subCatActiveBadgeText}>
                Phân loại: {activeSubCategory.name}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>
          Khai báo tình trạng chi tiết theo phân loại
        </Text>
        <Text style={styles.sectionSubtitle}>
          Mỗi loại sản phẩm chỉ hỏi những tiêu chí áp dụng cho nó. Thông tin do bạn tự khai báo và được lưu lại làm căn cứ khi có khiếu nại.
        </Text>
      </View>

      {/* Sub-category Selector (if available) */}
      {hasSubCategories && (
        <View style={[styles.subCategoryContainer, errors.subCategoryId && styles.subCategoryContainerError]}>
          <View style={styles.labelRow}>
            <Text style={styles.subCategoryTitle}>
              1. Món đồ của bạn thuộc loại nào? <Text style={styles.requiredStar}>*</Text>
            </Text>
          </View>

          {errors.subCategoryId && (
            <Text style={styles.fieldErrorText}>⚠️ {errors.subCategoryId}</Text>
          )}

          <View style={styles.subCategoryPillsWrap}>
            {subCategories.map((sub) => {
              const isSelected = activeSubCategory?.id === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  activeOpacity={0.7}
                  onPress={() => onSelectSubCategory && onSelectSubCategory(sub.id)}
                  style={[
                    styles.subCategoryPill,
                    isSelected && styles.subCategoryPillSelected,
                  ]}
                >
                  <Ionicons
                    name={sub.icon || 'pricetag-outline'}
                    size={15}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.subCategoryPillText,
                      isSelected && styles.subCategoryPillTextSelected,
                    ]}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* What the chosen type covers, so the seller can check it is the right one */}
          <View style={styles.contextNoticeBox}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.contextNoticeText}>
              {activeSubCategory
                ? `Gồm: ${activeSubCategory.description}. Không đúng món đồ của bạn? Hãy chọn loại khác hoặc mục "Khác".`
                : 'Chọn đúng loại sản phẩm để chỉ hiện những tiêu chí phù hợp với món đồ của bạn.'}
            </Text>
          </View>
        </View>
      )}

      {hasSubCategories && !activeSubCategory ? null : (
        <View style={styles.fieldsContainer}>
          <Text style={styles.fieldsSectionTitle}>
            {hasSubCategories ? '2. Khai báo tình trạng món đồ' : 'Khai báo tình trạng món đồ'}
          </Text>

          {activeSchema.map((field) => {
            const value = formData[field.fieldKey];
            const fieldError = errors[field.fieldKey];

            return (
              <View key={field.fieldKey} style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, fieldError && styles.fieldLabelError]}>
                    {field.label}
                  </Text>
                  {field.required ? (
                    <Text style={styles.requiredStar}>*</Text>
                  ) : (
                    <Text style={styles.optionalText}> (không bắt buộc)</Text>
                  )}
                </View>

                {Boolean(field.hint) && <Text style={styles.hintText}>{field.hint}</Text>}

                {fieldError && (
                  <Text style={styles.fieldErrorText}>⚠️ {fieldError}</Text>
                )}

                {/* Select field (rendered as selectable option pills) */}
                {field.type === 'select' && (
                  <View style={[styles.optionsWrap, fieldError && styles.optionsWrapError]}>
                    {field.options.map((opt) => {
                      const isSelected = value === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          activeOpacity={0.7}
                          onPress={() => handleSelectOption(field, opt)}
                          style={[
                            styles.optionPill,
                            isSelected && styles.optionPillSelected,
                            fieldError && !isSelected && styles.optionPillError,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionPillText,
                              isSelected && styles.optionPillTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Multiselect field (accessories, inclusions, extras) */}
                {field.type === 'multiselect' && (
                  <View style={[styles.optionsWrap, fieldError && styles.optionsWrapError]}>
                    {field.options.map((opt) => {
                      const isSelected = Array.isArray(value) && value.includes(opt);
                      return (
                        <TouchableOpacity
                          key={opt}
                          activeOpacity={0.7}
                          onPress={() => handleToggleMultiSelect(field.fieldKey, opt)}
                          style={[
                            styles.optionPill,
                            isSelected && styles.optionPillSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionPillText,
                              isSelected && styles.optionPillTextSelected,
                            ]}
                          >
                            {isSelected ? `✓ ${opt}` : `+ ${opt}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Number input (e.g. Battery health %) */}
                {field.type === 'number' && (
                  <View
                    style={[
                      styles.numberInputWrapper,
                      fieldError && styles.numberInputWrapperError,
                    ]}
                  >
                    <TextInput
                      value={
                        value !== undefined && value !== null && value !== ''
                          ? (field.max > 100 ? formatNumberWithDots(value) : String(value))
                          : ''
                      }
                      onChangeText={(text) => {
                        const cleanNum = text.replace(/[^0-9]/g, '');
                        let numVal = cleanNum ? Number(cleanNum) : '';
                        // Never accept more than the field allows (e.g. 100 % battery)
                        if (typeof numVal === 'number' && field.max !== undefined && numVal > field.max) {
                          numVal = field.max;
                        }
                        onChangeField(field.fieldKey, numVal);
                      }}
                      placeholder={field.placeholder || 'Nhập số'}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      style={styles.numberInput}
                      maxLength={field.max !== undefined ? (field.max > 100 ? 12 : String(field.max).length) : 12}
                    />
                    {Boolean(field.unit) && <Text style={styles.numberUnitText}>{field.unit}</Text>}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  optionalText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  headerBlock: {
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  categoryBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  subCatActiveBadge: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  subCatActiveBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  sectionHeader: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: 4,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  subCategoryContainer: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subCategoryContainerError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  subCategoryTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subCategoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  subCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  subCategoryPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subCategoryPillText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subCategoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contextNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: spacing.sm,
    gap: 6,
  },
  contextNoticeText: {
    ...typography.caption,
    color: colors.primaryDark || colors.primary,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  fieldsContainer: {
    marginTop: spacing.xs,
  },
  fieldsSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fieldLabelError: {
    color: colors.danger,
    fontWeight: '700',
  },
  fieldErrorText: {
    ...typography.caption,
    color: colors.danger,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  requiredStar: {
    color: colors.danger,
    marginLeft: 3,
    fontWeight: '700',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionsWrapError: {
    padding: 4,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
  },
  optionPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  optionPillError: {
    borderColor: '#FCA5A5',
  },
  optionPillSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionPillTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  numberInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  numberInputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  numberInput: {
    flex: 1,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  numberUnitText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 6,
  },
});
