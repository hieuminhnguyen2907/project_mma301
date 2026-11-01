// Currency formatting utilities for Vietnamese Dong (VND) & USD
export const formatCurrency = (amount, currency = 'VND') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₫';
  }

  const num = Number(amount);
  if (currency === 'VND') {
    return `${num.toLocaleString('vi-VN')} ₫`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
};

export const parseCurrencyInput = (value) => {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};

/**
 * Formats a raw number or numeric string with Vietnamese thousand separator dots (e.g. 5000000 -> 5.000.000)
 */
export const formatNumberWithDots = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const digits = String(val).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Real-time input formatter for number/currency text fields.
 * Gracefully handles typing, pasting, backspacing digits, and backspacing dot separators.
 */
export const formatNumberInput = (text, prevText = '') => {
  if (!text) return '';
  const cleanDigits = String(text).replace(/\D/g, '');
  const prevDigits = String(prevText || '').replace(/\D/g, '');

  let digits = cleanDigits;
  // If user hit backspace directly on a separator dot:
  if (prevText && text.length < prevText.length && cleanDigits === prevDigits && cleanDigits.length > 0) {
    digits = cleanDigits.slice(0, -1);
  }

  const normalized = digits.replace(/^0+(?=\d)/, '');
  if (!normalized) return '';

  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
