/**
 * @file    theme.js
 * @module  Shared UI
 * @desc    Central design tokens for the Care4U mobile app — colors, typography,
 *          spacing, and radius — mirrors the web CSS variables in index.css so
 *          both platforms stay visually identical.
 * @author  Wasana Karunanayaka (S/21/081)
 */

export const colors = {
  background: '#FFFFFF',
  foreground: '#020817',

  card: '#FFFFFF',
  cardForeground: '#020817',

  // Clinical Teal - primary CTAs, links, active states
  primary: '#14B3A0',
  primaryForeground: '#F8FAFC',

  // Deep Brand Teal - headers, hero bands, tab bar background
  brandDeep: '#0B3B37',
  brandDeepForeground: '#F8FAFC',

  secondary: '#F1F5F9',
  secondaryForeground: '#0F172A',

  muted: '#F1F5F9',
  mutedForeground: '#64748B',

  border: '#E2E8F0',

  destructive: '#EF4444',
  destructiveForeground: '#F8FAFC',

  // Urgent Amber - emergency button, hotlines, critical alerts ONLY
  urgent: '#F59E0B',
  urgentForeground: '#3A2607',

  // Success Green - confirmations, completed states
  success: '#1F9D55',
  successForeground: '#F8FAFC',
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const typography = {
  fontFamily: {
    // NOTE: requires expo-font + @expo-google-fonts/plus-jakarta-sans to be
    // installed and loaded in App.js — flagged as a follow-up in Ticket 9.
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
