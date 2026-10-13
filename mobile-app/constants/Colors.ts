/**
 * Event Week App - Sade ve Modern Tema
 * Giriş Matrix paleti ile aynı mavi-turkuaz vurgu
 */

import { Brand } from './matrix';

const primaryColor = Brand.primary;
const primaryDark = Brand.primaryDark;
const secondaryColor = '#64748b';
const successColor = '#059669';
const warningColor = '#d97706';
const errorColor = '#dc2626';

export const Colors = {
  light: {
    primary: primaryColor,
    primaryDark: primaryDark,
    secondary: secondaryColor,
    success: successColor,
    warning: warningColor,
    error: errorColor,

    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',

    background: '#ffffff',
    backgroundSecondary: '#f4fafc',
    backgroundTertiary: '#e8f6fb',

    border: '#d7eef6',
    borderLight: '#eaf6fb',

    card: '#ffffff',
    cardSecondary: '#f4fafc',

    icon: '#64748b',
    iconSecondary: '#94a3b8',
    iconMuted: '#cbd5e1',

    tabIconDefault: '#94a3b8',
    tabIconSelected: primaryColor,
    tabBackground: '#ffffff',

    overlay: 'rgba(0, 0, 0, 0.5)',

    active: successColor,
    inactive: '#94a3b8',
    pending: warningColor,
  },
  dark: {
    primary: Brand.primary,
    primaryDark: Brand.primaryDark,
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',

    text: '#f0f9ff',
    textSecondary: '#b6d7e8',
    textMuted: '#7aa3b8',

    background: '#071422',
    backgroundSecondary: '#0D2130',
    backgroundTertiary: '#143044',

    border: '#1A3A50',
    borderLight: '#23485F',

    card: '#0D2130',
    cardSecondary: '#143044',

    icon: '#b6d7e8',
    iconSecondary: '#7aa3b8',
    iconMuted: '#4d6f82',

    tabIconDefault: '#4d6f82',
    tabIconSelected: Brand.primary,
    tabBackground: '#071422',

    overlay: 'rgba(0, 0, 0, 0.7)',

    active: '#10b981',
    inactive: '#4d6f82',
    pending: '#f59e0b',
  },
};

export const AdditionalColors = {
  gradient: {
    primary: [primaryColor, primaryDark],
    success: [successColor, '#047857'],
    warning: [warningColor, '#b45309'],
    error: [errorColor, '#b91c1c'],
  },

  opacity: {
    10: `rgba(${Brand.rgb}, 0.1)`,
    20: `rgba(${Brand.rgb}, 0.2)`,
    30: `rgba(${Brand.rgb}, 0.3)`,
    50: `rgba(${Brand.rgb}, 0.5)`,
  },

  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.25)',
  },
};
