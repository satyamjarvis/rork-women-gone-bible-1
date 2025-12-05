export const colors = {
  primary: {
    teal: '#5DCED4',
    darkTeal: '#2FA2A8',
    lightTeal: '#E0F7F7',
    purple: '#B695D6',
    darkPurple: '#8B6BB0',
    lavender: '#F3ECF9',
    pink: '#F9B4C5',
    softPink: '#FFE4EC',
    mauve: '#9B7EBE',
    lilac: '#C8B5E3',
    dustyBlue: '#7FA3B8',
    softBlue: '#B8D4E3',
    lightBlue: '#E8F3F8',
  },
  neutral: {
    cream: '#FDF8F3',
    white: '#FFFFFF',
    softGray: '#E8E6EA',
    lightGray: '#F8F6FA',
    textGray: '#8B8897',
    darkGray: '#4A4550',
  },
  functional: {
    text: '#3E2C4A',
    textSecondary: '#736881',
    border: '#E8E0EE',
    error: '#E67C8A',
    success: '#4CAF50',
    successLight: '#E8F5E9',
  },
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
