/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 다크 테마 — 로고(금색 STAGE + 극장 크림슨) 기준. 화면 코드는 색상
        // 리터럴 대신 이 시맨틱 토큰만 참조하므로, 팔레트를 바꾸려면 여기만 고치면 됩니다.
        // 레거시 별칭(surface/ink/ink-2/ink-3)은 기존 60여개 화면이 그대로 참조 중이라
        // 남겨뒀습니다 — 새 코드는 surface-1/text/text-muted/text-dim을 쓰세요.
        bg: '#0B0B0F',
        surface: '#14141A', // = surface-1 (레거시 별칭)
        'surface-1': '#14141A',
        'surface-2': '#1C1C24',
        'surface-3': '#262630',
        border: '#2A2A35',
        'border-strong': '#3A3A47',
        ink: '#F5F5F7', // = text (레거시 별칭)
        text: '#F5F5F7',
        'ink-2': '#9A9AA5', // = text-muted (레거시 별칭)
        'text-muted': '#9A9AA5',
        'ink-3': '#6E6E7A', // = text-dim (레거시 별칭)
        'text-dim': '#6E6E7A',

        // 브랜드 = 금색 (액션 전용, 버튼/활성상태/우리무대 뱃지)
        gold: { 400: '#F7C851', 500: '#F0B429', 600: '#D89A1E', DEFAULT: '#F0B429', ink: '#14100A' },
        // 분위기 = 크림슨 (히어로·커튼 전용, 버튼 금지)
        crimson: { 700: '#8E1424', 600: '#C0271F' },

        // 레거시 brand.* — 히어로/커튼 전용 그라데이션에서만 참조(§1). 새 UI에서는 gold.*를 쓰세요.
        brand: { from: '#F7C851', to: '#D89A1E', DEFAULT: '#F0B429' },

        // 의미 색 — 금색과 충돌하지 않게 분리
        ok: '#3DBE7A',
        success: '#3DBE7A',
        warn: '#E8873A',
        warning: '#E8873A',
        danger: '#E5484D',
        info: '#5B8DEF',
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
        // 타이포 스케일(§2) — [크기, {줄높이, 자간, 굵기}]. 이 밖의 크기는 쓰지 않습니다.
        caption: ['11.5px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '700' }],
        small: ['13px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '500' }],
        h3: ['17px', { lineHeight: '1.4', letterSpacing: '-0.015em', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.35', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '800' }],
        display: ['32px', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '800' }],
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '240ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        enter: 'cubic-bezier(0, 0, 0, 1)',
        exit: 'cubic-bezier(0.3, 0, 1, 1)',
      },
      keyframes: {
        'pin-pop': {
          '0%': { transform: 'scale(0) translateY(-16px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { opacity: '0.6' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.6' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.7)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'pin-pop': 'pin-pop 420ms cubic-bezier(.16,1,.3,1) both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
