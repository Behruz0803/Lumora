/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF6F0',
          100: '#D2ECE0',
          200: '#A6D9C2',
          300: '#6FBF9C',
          400: '#3BA377',
          500: '#0F8B5F',
          600: '#0C7650',
          700: '#086B48',
          800: '#075538',
          900: '#06422C',
        },
        ink: {
          DEFAULT: '#14251E',
          soft: '#3C4A43',
          muted: '#718078',
        },
        surface: '#FFFFFF',
        canvas: '#F7F9F8',
        line: '#E4EBE7',
        warning: '#E9A23B',
        danger: '#DC5555',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 37, 30, 0.04), 0 1px 3px rgba(20, 37, 30, 0.03)',
        raised: '0 4px 16px rgba(20, 37, 30, 0.06), 0 1px 3px rgba(20, 37, 30, 0.04)',
        modal: '0 24px 64px rgba(20, 37, 30, 0.18)',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-in': 'slide-in 200ms ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
