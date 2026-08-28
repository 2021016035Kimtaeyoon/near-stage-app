/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 화이트 테마 — 흰 바탕 기본. 화면 코드는 색상 리터럴 대신
        // 이 시맨틱 토큰만 참조하므로, 팔레트를 바꾸려면 여기만 고치면 됩니다.
        bg: '#FFFFFF',
        surface: '#FFFFFF',
        'surface-2': '#F2F2F5',
        border: '#E5E5EA',
        'border-strong': '#D1D1D9',
        ink: '#17171C',
        'ink-2': '#5B5B66',
        'ink-3': '#8B8B96',
        brand: { from: '#FF6B4A', to: '#FF3D77', DEFAULT: '#FF5560' },
        ok: '#1EA672',
        warn: '#D98A00',
        danger: '#E0403E',
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
