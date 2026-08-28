/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F',
        surface: '#16161D',
        'surface-2': '#1D1D26',
        border: '#26262F',
        'border-strong': '#34343F',
        ink: '#F5F5F7',
        'ink-2': '#9A9AA5',
        'ink-3': '#6B6B77',
        brand: { from: '#FF6B4A', to: '#FF3D77', DEFAULT: '#FF5560' },
        ok: '#4ED4A0',
        warn: '#FFC24A',
        danger: '#FF5A5A',
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      borderRadius: { xl: '16px', '2xl': '20px', '3xl': '24px' },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      keyframes: {
        'pin-pop': {
          '0%': { transform: 'scale(0) translateY(-16px)', opacity: '0' },
          '60%': { transform: 'scale(1.35) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.7)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'pin-pop': 'pin-pop 620ms cubic-bezier(.22,1.3,.36,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
