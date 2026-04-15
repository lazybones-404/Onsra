import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0D0D1A',
    background: '#F7F7FB',
    surface: '#FFFFFF',
    card: '#EDEDF7',
    tint: '#6558F5',
    accent: '#6558F5',
    accentMuted: '#EAE8FE',
    icon: '#6B6B8D',
    tabIconDefault: '#ADADCC',
    tabIconSelected: '#6558F5',
    border: '#DDDDF0',
    muted: '#9898B8',
    danger: '#E5534B',
    success: '#3FB950',
  },
  dark: {
    text: '#F2F2FA',
    background: '#0D0D14',
    surface: '#1A1A26',
    card: '#21213A',
    tint: '#7C6CF7',
    accent: '#7C6CF7',
    accentMuted: '#2A2545',
    icon: '#8585A8',
    tabIconDefault: '#4A4A6A',
    tabIconSelected: '#7C6CF7',
    border: '#2A2A40',
    muted: '#606080',
    danger: '#F85149',
    success: '#3FB950',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
