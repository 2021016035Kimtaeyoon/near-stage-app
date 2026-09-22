/** @type {import('tailwindcss').Config} */

// CSS 변수(rgb 삼중값, src/index.css의 :root / [data-theme='light'])를 읽어오는 색상 헬퍼.
// 클래스 이름(bg-bg, text-ink, bg-gold-500/90 등)은 그대로 두고 실제 값만 테마에 따라
// 바뀌게 해서, 라이트/다크 토글을 화면 코드 수정 없이 켤 수 있게 합니다.
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue !== undefined ? `rgb(var(${varName}) / ${opacityValue})` : `rgb(var(${varName}))`
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 다크/라이트 두 테마를 모두 이 토큰으로 표현합니다. 화면 코드는 색상 리터럴 대신
        // 이 시맨틱 토큰만 참조하므로, 팔레트를 바꾸려면 src/index.css의 CSS 변수만 고치면 됩니다.
        // 레거시 별칭(surface/ink/ink-2/ink-3)은 기존 60여개 화면이 그대로 참조 중이라
        // 남겨뒀습니다 — 새 코드는 surface-1/text/text-muted/text-dim을 쓰세요.
        bg: withOpacity('--color-bg'),
        surface: withOpacity('--color-surface-1'), // = surface-1 (레거시 별칭)
        'surface-1': withOpacity('--color-surface-1'),
        'surface-2': withOpacity('--color-surface-2'),
        'surface-3': withOpacity('--color-surface-3'),
        border: withOpacity('--color-border'),
        'border-strong': withOpacity('--color-border-strong'),
        ink: withOpacity('--color-text'), // = text (레거시 별칭)
        text: withOpacity('--color-text'),
        'ink-2': withOpacity('--color-text-muted'), // = text-muted (레거시 별칭)
        'text-muted': withOpacity('--color-text-muted'),
        'ink-3': withOpacity('--color-text-dim'), // = text-dim (레거시 별칭)
        'text-dim': withOpacity('--color-text-dim'),

        // 브랜드 = 금색 (액션 전용, 버튼/활성상태/우리무대 뱃지)
        gold: {
          400: withOpacity('--color-gold-400'),
          500: withOpacity('--color-gold-500'),
          600: withOpacity('--color-gold-600'),
          DEFAULT: withOpacity('--color-gold-500'),
          // 금색 '채움' 위에 올리는 글자색 (밝은 노랑 위 어두운 잉크)
          ink: withOpacity('--color-gold-ink'),
          // 배경 위에 금색 '글자·아이콘'으로 쓸 때 (라이트에선 진한 금색, 다크에선 밝은 노랑)
          text: withOpacity('--color-gold-text'),
        },
        // 분위기 = 크림슨 (히어로·커튼 전용, 버튼 금지) — 테마와 무관하게 항상 어두운 무대 톤 고정
        crimson: { 700: '#8E1424', 600: '#C0271F' },

        // 클립(쇼츠) 배경 — 영상 뒤 여백은 라이트 테마에서도 항상 어두워야 재생 화면이
        // 붕 뜨지 않습니다. crimson과 같은 이유로 테마 무관 고정색이고, 같은 값이
        // 3개 파일에 리터럴로 흩어져 있던 걸 여기로 모았습니다.
        stage: { DEFAULT: '#0B0B0F', 2: '#1A1A24' },

        // 레거시 brand.* — 히어로/커튼 전용 그라데이션에서만 참조(§1). 새 UI에서는 gold.*를 쓰세요.
        brand: {
          from: withOpacity('--color-gold-400'),
          to: withOpacity('--color-gold-600'),
          DEFAULT: withOpacity('--color-gold-500'),
        },

        // 의미 색 — 금색과 충돌하지 않게 분리, 테마 공통(가독성 검증된 중간톤이라 그대로 유지)
        ok: withOpacity('--color-ok'),
        success: withOpacity('--color-ok'),
        warn: withOpacity('--color-warn'),
        warning: withOpacity('--color-warn'),
        danger: withOpacity('--color-danger'),
        info: withOpacity('--color-info'),
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
