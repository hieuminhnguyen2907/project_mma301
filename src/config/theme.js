// Theme & Design Tokens for ReMarket (Deep Emerald Green Identity)
export const colors = {
  // Primary Emerald Scale
  primary: '#0F766E',        // Deep emerald green
  primaryDark: '#115E59',    // Darker emerald for active/pressed
  primaryLight: '#14B8A6',   // Bright teal accent
  primarySoft: '#CCFBF1',    // Very soft emerald background for tags/badges
  
  // Secondary & Accents
  secondary: '#0369A1',      // Ocean blue accent
  secondarySoft: '#E0F2FE',
  accent: '#F59E0B',         // Amber for ratings, stars, warnings
  accentSoft: '#FEF3C7',
  
  // Neutral Tones
  background: '#F8FAFC',     // Clean soft canvas
  surface: '#FFFFFF',        // Card and modal background
  surfaceElevated: '#FFFFFF',
  
  // Typography Colors
  textPrimary: '#0F172A',    // Near-black slate for maximum contrast
  textSecondary: '#475569',  // Medium slate for body & descriptions
  textMuted: '#94A3B8',      // Light slate for hints & placeholders
  textInverse: '#FFFFFF',    // White text on dark buttons/badges
  
  // Border & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0F766E',
  
  // Semantic State Colors
  success: '#10B981',        // Emerald success
  successSoft: '#D1FAE5',
  warning: '#F59E0B',        // Amber warning
  warningSoft: '#FEF3C7',
  danger: '#EF4444',         // Ruby red error/danger
  dangerSoft: '#FEE2E2',
  info: '#3B82F6',           // Blue info
  infoSoft: '#DBEAFE',

  // Condition Status Badges
  conditionLikeNew: '#059669',
  conditionVeryGood: '#0D9488',
  conditionGood: '#2563EB',
  conditionAcceptable: '#D97706',
  conditionDefective: '#DC2626',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const typography = {
  h1: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    color: colors.textMuted,
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};
