export const colors = {
  background: '#0D0D14',
  surface: '#16161F',
  surfaceAlt: '#1E1E2E',
  accent: '#7C6CF7',
  accentLight: '#9D8FFF',
  accentMuted: '#3D3580',
  foreground: '#FFFFFF',
  muted: '#9CA3AF',
  mutedDark: '#6B7280',
  border: '#2A2A3A',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  inTune: '#22C55E',
  sharp: '#EF4444',
  flat: '#3B82F6',
} as const;

export type Color = keyof typeof colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
} as const;
