import React, { useState, useRef, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../config/theme';
import { KeyboardAwareContext } from './KeyboardAwareScrollView';
import { formatNumberInput, formatNumberWithDots } from '../../utils/currency';

export const Input = ({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  error,
  hint,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  editable = true,
  maxLength,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  formatNumber = false,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const containerRef = useRef(null);
  const keyboardContext = useContext(KeyboardAwareContext);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
    if (keyboardContext?.scrollToInput && containerRef.current) {
      keyboardContext.scrollToInput(containerRef.current);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleChangeText = (text) => {
    if (formatNumber) {
      const formatted = formatNumberInput(text, value);
      if (onChangeText) onChangeText(formatted);
    } else {
      if (onChangeText) onChangeText(text);
    }
  };

  const resolvedValue =
    formatNumber && value !== undefined && value !== null && value !== ''
      ? formatNumberWithDots(value)
      : value;

  const resolvedKeyboardType =
    formatNumber && keyboardType === 'default' ? 'numeric' : keyboardType;

  return (
    <View ref={containerRef} collapsable={false} style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          error && styles.errorWrapper,
          !editable && styles.disabledWrapper,
          multiline && { minHeight: numberOfLines * 24 + 20, alignItems: 'flex-start' },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          value={resolvedValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={resolvedKeyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          // Email / password fields must not be capitalised or auto-corrected
          autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' || secureTextEntry ? 'none' : 'sentences')}
          autoCorrect={autoCorrect ?? !(keyboardType === 'email-address' || secureTextEntry)}
          autoComplete={autoComplete}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            multiline && { textAlignVertical: 'top' },
            inputStyle,
          ]}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subtitle,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  focusedWrapper: {
    borderColor: colors.borderFocus,
    backgroundColor: '#FAFDFD',
  },
  errorWrapper: {
    borderColor: colors.danger,
  },
  disabledWrapper: {
    backgroundColor: colors.borderLight,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 2,
    fontSize: 12,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 2,
  },
});
