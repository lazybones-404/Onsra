/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0D0D14',
        surface: '#16161F',
        'surface-alt': '#1E1E2E',
        accent: '#7C6CF7',
        'accent-light': '#9D8FFF',
        'accent-muted': '#3D3580',
        foreground: '#FFFFFF',
        muted: '#9CA3AF',
        'muted-dark': '#6B7280',
        border: '#2A2A3A',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'in-tune': '#22C55E',
        sharp: '#EF4444',
        flat: '#3B82F6',
      },
    },
  },
  plugins: [],
};
