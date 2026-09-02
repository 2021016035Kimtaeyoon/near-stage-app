import { cubicBezier, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { buildFolds, FOLD_TYPES, FOLD_WIDTHS, type Fold } from './curtainFolds'
import {
  ACT1_TITLE_FADEOUT_END,
  ACT1_TITLE_FADEOUT_START,
  ACT2_END,
  ACT2_LOGO_SHRINK_END,
  ACT2_LOGO_SHRINK_START,
  ACT2_START,
  CURTAIN_CUE_FADE_END,
  CURTAIN_EMBLEM_FADE_END,
  CURTAIN_OPEN_END,
  CURTAIN_OPEN_START,
  DEV_JUMPS,
  HERO_TAGLINE,
  LANDING_AT,
  LANDING_DUST_END,
  LANDING_FLASH_END,
  LANDING_SHAKE_END,
  LANDING_SQUASH_END,
  LIGHT_CENTER_RANGE,
  LIGHT_LEFT_RANGE,
  LIGHT_RIGHT_RANGE,
  LOGO_FADE_IN_END,
  LOGO_FALL_END,
  LOGO_FALL_START,
  PANEL_CONTENT_WINDOWS,
  PANEL_SCALE_END,
  PANEL_X_END,
  SCALLOP_DEPTH,
  SCALLOP_TILE,
  STAGE_BRIGHTNESS_END,
  STAGE_BRIGHTNESS_START,
  TRACK_X_RANGE,
  VALANCE_HEIGHT,
} from './heroTimeline'

const FALL_EASE = cubicBezier(0.55, 0.06, 0.68, 0.19)
const CURTAIN_EASE = cubicBezier(0.4, 0, 0.2, 1)
const DEBUG_STORAGE_KEY = 'ns-hero-debug'

interface Panel {
  num: string
  role: string
  quote: string
  body: string
  solution: string
  withCta?: boolean
}

const PANELS: Panel[] = [
  {
    num: '01',
    role: '아티스트',
    quote: '무대가 없다',
    body: '밴드·마술·스탠드업·연극·토론. 재능은 있는데 설 곳이 없습니다.',
    solution: 'NEAR:STAGE는 동네 카페와 바를 무대로 만듭니다.',
  },
  {
    num: '02',
    role: '공간',
    quote: '손님이 없다',
    body: '한가한 수요일 저녁. 자리는 비어 있고 임대료는 나갑니다.',
    solution: '빈 시간을 공연으로 채워 손님을 데려옵니다.',
  },
  {
    num: '03',
    role: '공연보기',
    quote: '볼 게 없다',
    body: '주말 저녁, 뭘 볼지 검색해도 정식 공연장만 나옵니다.',
    solution: '걸어갈 수 있는 거리의 무대가 지도에 뜹니다.',
    withCta: true,
  },
]

function lightFlicker(range: [number, number]): [number[], number[]] {
  const [s, e] = range
  const d = e - s
  return [
    [s, s + d * 0.25, s + d * 0.5, s + d * 0.75, e],
    [0, 0.7, 0.3, 0.92, 1],
  ]
}

/**
 * 랜딩 히어로 — 커튼이 걷히고 무대에 조명이 켜지며 로고가 낙하해 착지한 뒤,
 * 무대 위에서 설명 패널 3개가 가로로 지나가는 하나의 스크롤 연동 pin 섹션.
 * 타이밍 상수는 ./heroTimeline.ts, 자세한 설명은 ./ANIMATION.md 참고.
 */
export function DarkStageHero() {
  const navigate = useNavigate()
  const ref = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const shortViewport = useMediaQuery('(max-height: 760px)')

  const [devProgress, setDevProgress] = useState(0)
  const [debugOpen, setDebugOpen] = useState(false)

  // 'end end' — pin이 실제로 풀리는 지점(섹션 바닥이 뷰포트 바닥에 닿는 순간)에서
  // 정확히 progress=1이 되도록 맞춘다. 'end start'를 쓰면 뷰포트 높이만큼 더
  // 스크롤해야 1에 도달해, 실제 CSS sticky가 풀리는 시점보다 진행률이 항상 뒤처져
  // 2막 뒷부분(패널2~3)이 pin 밖에서 재생되며 흰 배경으로 떨어지는 버그가 생겼다.
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(p, 'change', (v) => {
    if (import.meta.env.DEV) setDevProgress(v)
  })

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      setDebugOpen(true)
    } else if (window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1') {
      setDebugOpen(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setDebugOpen((prev) => {
          const next = !prev
          window.localStorage.setItem(DEBUG_STORAGE_KEY, next ? '1' : '0')
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── 스크롤 유도 ────────────────────────────────────────────────
  const scrollCueOpacity = useTransform(p, [0, 0.02, CURTAIN_CUE_FADE_END], [1, 1, 0])

  // ── 커튼 (좌우 분할 개막) ────────────────────────────────────────
  const panelScaleX = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], [1, PANEL_SCALE_END], {
    ease: CURTAIN_EASE,
  })
  const leftPanelX = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], ['0%', `-${PANEL_X_END}%`], {
    ease: CURTAIN_EASE,
  })
  const rightPanelX = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], ['0%', `${PANEL_X_END}%`], {
    ease: CURTAIN_EASE,
  })
  const seamOpacity = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], [1, 0])
  const emblemOpacity = useTransform(p, [0, CURTAIN_EMBLEM_FADE_END], [1, 0])

  // ── 무대 밝기 + 착지 흔들림(무대 컨테이너 전용) ─────────────────
  const stageBrightness = useTransform(p, [STAGE_BRIGHTNESS_START, STAGE_BRIGHTNESS_END], [0.28, 1])
  const stageFilter = useTransform(stageBrightness, (b) => `brightness(${b})`)
  const stageShakeY = useTransform(
    p,
    [
      LANDING_AT,
      LANDING_AT + (LANDING_SHAKE_END - LANDING_AT) * 0.4,
      LANDING_AT + (LANDING_SHAKE_END - LANDING_AT) * 0.75,
      LANDING_SHAKE_END,
    ],
    [0, 4, -2, 0],
  )

  // ── 조명 3개 (좌 → 우 → 중앙) ───────────────────────────────────
  const [leftIn, leftOut] = lightFlicker(LIGHT_LEFT_RANGE)
  const [rightIn, rightOut] = lightFlicker(LIGHT_RIGHT_RANGE)
  const [centerIn, centerOut] = lightFlicker(LIGHT_CENTER_RANGE)
  const leftLight = useTransform(p, leftIn, leftOut)
  const rightLight = useTransform(p, rightIn, rightOut)
  const centerLight = useTransform(p, centerIn, centerOut)

  // ── 로고 낙하 ──────────────────────────────────────────────────
  const logoFallY = useTransform(p, [LOGO_FALL_START, LOGO_FALL_END], ['-118vh', '0vh'], { ease: FALL_EASE })
  const logoRotate = useTransform(p, [LOGO_FALL_START, LOGO_FALL_END], [-3, 0], { ease: FALL_EASE })
  const logoFallOpacity = useTransform(p, [LOGO_FALL_START, LOGO_FADE_IN_END], [0, 1])

  // ── 착지 스쿼시 ────────────────────────────────────────────────
  const sq = LANDING_SQUASH_END - LANDING_AT
  const squashStops = [
    LANDING_AT,
    LANDING_AT + sq * 0.25,
    LANDING_AT + sq * 0.55,
    LANDING_AT + sq * 0.8,
    LANDING_SQUASH_END,
  ]
  const squashScaleY = useTransform(p, squashStops, [1, 0.86, 1.06, 0.97, 1])
  const squashScaleX = useTransform(p, squashStops, [1, 1.14, 0.94, 1.03, 1])

  // ── 2막: 로고 축소 + 좌상단 이동 ─────────────────────────────────
  const act2LogoScale = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], [1, 0.4])
  const act2LogoX = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], ['0vw', '-38vw'])
  const act2LogoY = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], ['0vh', '-32vh'])
  const act2LogoOpacity = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], [1, 0.5])
  const logoOpacity = useTransform([logoFallOpacity, act2LogoOpacity], (values) => {
    const [a, b] = values as number[]
    return a * b
  })

  // ── 먼지 / 섬광 / 반사 ────────────────────────────────────────
  const dustOpacity = useTransform(p, [LANDING_AT, LANDING_AT + 0.03, LANDING_DUST_END], [0, 0.5, 0])
  const dustScale = useTransform(p, [LANDING_AT, LANDING_DUST_END], [0.35, 2.9])
  const flashOpacity = useTransform(p, [LANDING_AT, LANDING_AT + 0.015, LANDING_FLASH_END], [0, 0.22, 0])
  const reflectionOpacity = useTransform(
    p,
    [LOGO_FALL_START, LOGO_FADE_IN_END, ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END],
    [0, 0.16, 0.16, 0],
  )

  // ── 1막 타이틀/CTA ────────────────────────────────────────────
  const act1TextOpacity = useTransform(
    p,
    [LANDING_AT, LANDING_SQUASH_END, ACT1_TITLE_FADEOUT_START, ACT1_TITLE_FADEOUT_END],
    [0, 1, 1, 0],
  )

  // ── 2막 가로 트랙 ─────────────────────────────────────────────
  const trackX = useTransform(p, [ACT2_START, ACT2_END], TRACK_X_RANGE)

  const panel0Opacity = useTransform(p, PANEL_CONTENT_WINDOWS[0], [0, 1])
  const panel0Y = useTransform(p, PANEL_CONTENT_WINDOWS[0], [24, 0])
  const panel1Opacity = useTransform(p, PANEL_CONTENT_WINDOWS[1], [0, 1])
  const panel1Y = useTransform(p, PANEL_CONTENT_WINDOWS[1], [24, 0])
  const panel2Opacity = useTransform(p, PANEL_CONTENT_WINDOWS[2], [0, 1])
  const panel2Y = useTransform(p, PANEL_CONTENT_WINDOWS[2], [24, 0])
  const panelContent = [
    { opacity: panel0Opacity, y: panel0Y },
    { opacity: panel1Opacity, y: panel1Y },
    { opacity: panel2Opacity, y: panel2Y },
  ]

  const dot0 = useTransform(p, [0.6296, 0.7435, 0.8009], [0.3, 1, 0.3])
  const dot1 = useTransform(p, [0.7435, 0.8583, 0.9157], [0.3, 1, 0.3])
  const dot2 = useTransform(p, [0.9157, 0.9722, 1], [0.3, 1, 1])
  const dots = [dot0, dot1, dot2]

  // 숨 고르기(ACT1_HOLD) 구간을 늘린 만큼(×1.08) 전체 높이도 함께 늘려야
  // 다른 구간의 스크롤 체감 속도가 그대로 유지됩니다 — heroTimeline.ts 상단 설명 참고.
  const heroHeightClass = isMobile ? 'h-[432dvh]' : 'h-[605dvh]'

  if (prefersReducedMotion) {
    return <StaticHeroFallback onNavigate={navigate} />
  }

  const logoWidthClass = isMobile ? 'w-[220px]' : shortViewport ? 'w-[260px]' : 'w-[330px]'
  const gapClass = shortViewport ? 'gap-6' : 'gap-10'
  const ctaGapClass = shortViewport ? 'mt-4' : 'mt-7'
  // 주름 16개(모바일 10개) — 폭 배열을 잘라서 넘기면 buildFolds가 다시 100 단위로 정규화한다
  const folds = buildFolds(
    isMobile ? FOLD_WIDTHS.slice(0, 10) : FOLD_WIDTHS,
    isMobile ? FOLD_TYPES.slice(0, 10) : FOLD_TYPES,
  )

  return (
    <section ref={ref} className={`relative ${heroHeightClass} bg-[#0A0A0D]`}>
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        {/* 무대 (배경벽 + 바닥 + 사이드 커튼 + 조명 리그) */}
        <motion.div
          className="absolute inset-0"
          style={{ filter: stageFilter, y: stageShakeY, willChange: 'filter, transform' }}
        >
          <StageBackdrop />
          <SpotLight xPercent={27} opacity={leftLight} size={1} />
          <SpotLight xPercent={73} opacity={rightLight} size={1} />
          <SpotLight xPercent={50} opacity={centerLight} size={1.3} />
        </motion.div>

        {/* 착지 섬광 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
          style={{
            opacity: flashOpacity,
            mixBlendMode: 'screen',
            background: 'radial-gradient(ellipse 45% 60% at 50% 100%, rgba(255,255,255,.9) 0%, transparent 70%)',
            willChange: 'opacity',
          }}
        />

        {/* 1막: 로고 + 태그라인 + CTA — 하나의 flex 세로 스택, 겹칠 수 없는 구조 */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${gapClass} px-6`}>
          <motion.div
            className="relative"
            style={{ x: act2LogoX, y: act2LogoY, scale: act2LogoScale, willChange: 'transform' }}
          >
            {/* 바닥 반사 */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-0 top-full w-full origin-top"
              style={{
                opacity: reflectionOpacity,
                transform: 'scaleY(-1)',
                filter: 'blur(2px)',
                maskImage: 'linear-gradient(to top, transparent 8%, black 96%)',
                WebkitMaskImage: 'linear-gradient(to top, transparent 8%, black 96%)',
                willChange: 'opacity',
              }}
            >
              <LogoMark dark className={logoWidthClass} />
            </motion.div>

            {/* 먼지 */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2"
              style={{ opacity: dustOpacity, scale: dustScale, willChange: 'opacity, transform' }}
            >
              <div className="h-8 w-64 rounded-[100%] bg-white/70 blur-md" />
            </motion.div>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2"
              style={{ opacity: dustOpacity, scale: dustScale, willChange: 'opacity, transform' }}
            >
              <div className="h-5 w-40 rounded-[100%] bg-white/50 blur-sm" />
            </motion.div>

            {/* 로고 본체 */}
            <motion.div style={{ y: logoFallY, rotate: logoRotate, opacity: logoOpacity, willChange: 'transform, opacity' }}>
              <motion.div
                style={{ scaleY: squashScaleY, scaleX: squashScaleX, transformOrigin: 'center bottom', willChange: 'transform' }}
              >
                <LogoMark dark className={logoWidthClass} />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex flex-col items-center text-center"
            style={{ opacity: act1TextOpacity, willChange: 'opacity' }}
          >
            <p className="max-w-md text-[15px] font-semibold text-white/80">{HERO_TAGLINE}</p>
            <div className={`pointer-events-auto flex flex-wrap items-center justify-center gap-3 ${ctaGapClass}`}>
              <button
                onClick={() => navigate('/desktop')}
                className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink"
                style={{ boxShadow: '0 16px 40px rgba(255,196,46,.4)' }}
              >
                웹으로 둘러보기 →
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
              >
                모바일 앱 체험하기
              </button>
            </div>
          </motion.div>
        </div>

        {/* 2막: 가로 트랙 (반드시 sticky 컨테이너 안, pointer-events 살아있음) */}
        <motion.div className="absolute inset-0 z-20 flex" style={{ x: trackX, willChange: 'transform' }}>
          {PANELS.map((panel, i) => (
            <div key={panel.num} className="relative flex h-full w-screen shrink-0 items-center justify-center px-8">
              <span
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none font-black text-white/[0.05]"
                style={{ fontSize: 'min(42vw, 420px)', lineHeight: 1 }}
              >
                {panel.num}
              </span>
              <motion.div
                className="relative max-w-xl text-center sm:text-left"
                style={{ opacity: panelContent[i].opacity, y: panelContent[i].y }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">{panel.role}</p>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">“{panel.quote}”</p>
                <p className="mt-4 text-[15px] leading-relaxed text-white/70">{panel.body}</p>
                <p className="text-gold-text mt-3 text-[15px] font-bold">{panel.solution}</p>
                {panel.withCta && (
                  <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <button
                      onClick={() => navigate('/desktop')}
                      className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink"
                      style={{ boxShadow: '0 16px 40px rgba(255,196,46,.4)' }}
                    >
                      웹으로 둘러보기 →
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
                    >
                      모바일 앱 체험하기
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* 커튼 — 좌우 두 폭이 바깥쪽으로 오그라들며 갈라짐 */}
        <div className="pointer-events-none absolute inset-0 z-40">
          <motion.div
            aria-hidden
            className="absolute left-0 top-0 h-full w-[52%] origin-left"
            style={{ scaleX: panelScaleX, x: leftPanelX, willChange: 'transform' }}
          >
            <CurtainPanelSurface folds={folds} side="left" showVignette={!isMobile} />
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute right-0 top-0 h-full w-[52%] origin-right"
            style={{ scaleX: panelScaleX, x: rightPanelX, willChange: 'transform' }}
          >
            <CurtainPanelSurface folds={folds} side="right" showVignette={!isMobile} />
          </motion.div>
          {/* 중앙 이음새 — 닫혔을 때 두 폭이 맞물린 것처럼 보이게, 열리며 함께 사라짐 */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-1/2 w-[10px] -translate-x-1/2"
            style={{
              opacity: seamOpacity,
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,.55), transparent)',
            }}
          />
        </div>

        {/* 밸런스 — 절대 px 스캘럽 (SVG pattern, 화면이 넓어지면 개수만 늘어남) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40" style={{ height: VALANCE_HEIGHT }}>
          <svg width="100%" height={VALANCE_HEIGHT} preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              {/* 밸런스도 같은 천으로 보이도록 §2의 능선/골 그라데이션을 축소 적용 */}
              <linearGradient id="valance-ridge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A040A" />
                <stop offset="52%" stopColor="#C4213A" />
                <stop offset="100%" stopColor="#33050C" />
              </linearGradient>
              <linearGradient id="valance-valley" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E0308" />
                <stop offset="55%" stopColor="#6E0C18" />
                <stop offset="100%" stopColor="#24040A" />
              </linearGradient>
              <pattern id="ns-valance-fold" width="14" height={VALANCE_HEIGHT} patternUnits="userSpaceOnUse">
                <rect x="0" width="7" height={VALANCE_HEIGHT} fill="url(#valance-ridge)" />
                <rect x="7" width="7" height={VALANCE_HEIGHT} fill="url(#valance-valley)" />
              </pattern>
              <pattern id="ns-scallop" width={SCALLOP_TILE} height={VALANCE_HEIGHT} patternUnits="userSpaceOnUse">
                <path
                  d={`M0,0 H${SCALLOP_TILE} V${VALANCE_HEIGHT - SCALLOP_DEPTH} Q${SCALLOP_TILE / 2},${VALANCE_HEIGHT} 0,${VALANCE_HEIGHT - SCALLOP_DEPTH} Z`}
                  fill="url(#ns-valance-fold)"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ns-scallop)" />
          </svg>
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[#C9A227]" style={{ boxShadow: '0 6px 18px rgba(0,0,0,.5)' }} />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-9 -translate-x-1/2 text-[#C9A227]"
            style={{
              opacity: emblemOpacity,
              writingMode: 'vertical-rl',
              letterSpacing: '0.3em',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            NEAR:STAGE
          </motion.div>
        </div>

        {/* 스크롤 유도 */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1.5 text-white/70"
          style={{ opacity: scrollCueOpacity }}
        >
          <motion.span
            animate={{ y: [0, 6, 0], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-2xl"
          >
            ↓
          </motion.span>
          <span className="text-2xs font-semibold tracking-wide">스크롤해서 막을 올리세요</span>
        </motion.div>

        {/* 진행 인디케이터 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center gap-2">
          {dots.map((d, i) => (
            <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[#FFC42E]" style={{ opacity: d }} />
          ))}
        </div>
      </div>

      {import.meta.env.DEV && (
        <DebugPanel
          open={debugOpen}
          onClose={() => {
            setDebugOpen(false)
            window.localStorage.setItem(DEBUG_STORAGE_KEY, '0')
          }}
          progress={devProgress}
          heroRef={ref}
        />
      )}
    </section>
  )
}

function StageBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0A0A0D 0%, #121216 55%, #050506 100%),' +
            'repeating-linear-gradient(90deg, rgba(255,255,255,.018) 0px, rgba(255,255,255,.018) 1px, transparent 1px, transparent 26px)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[46%]" style={{ perspective: '640px', perspectiveOrigin: '50% 0%' }}>
        <div
          className="h-full w-full"
          style={{
            transform: 'rotateX(64deg)',
            transformOrigin: 'top',
            background:
              'repeating-linear-gradient(90deg, #17110D 0px, #1D1611 9px, #17110D 18px),' +
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.92) 92%)',
          }}
        />
      </div>
      <div
        className="absolute inset-y-0 left-0 w-[9%]"
        style={{ background: 'linear-gradient(90deg, #4A0B12 0%, #6B0F1B 100%)', boxShadow: 'inset -18px 0 30px rgba(0,0,0,.6)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[9%]"
        style={{ background: 'linear-gradient(270deg, #4A0B12 0%, #6B0F1B 100%)', boxShadow: 'inset 18px 0 30px rgba(0,0,0,.6)' }}
      />
      <svg className="absolute inset-x-0 top-0 h-[8%] w-full opacity-70" viewBox="0 0 400 40" preserveAspectRatio="none">
        <rect x="0" y="14" width="400" height="4" fill="#2B2B33" />
        {[40, 120, 200, 280, 360].map((x) => (
          <g key={x}>
            <rect x={x - 3} y="6" width="6" height="12" fill="#3A3A44" />
            <circle cx={x} cy="20" r="7" fill="#1C1C22" stroke="#3A3A44" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    </div>
  )
}

function SpotLight({
  xPercent,
  opacity,
  size,
}: {
  xPercent: number
  opacity: import('framer-motion').MotionValue<number>
  size: number
}) {
  return (
    <motion.div aria-hidden className="pointer-events-none absolute top-0" style={{ left: `${xPercent}%`, opacity, willChange: 'opacity' }}>
      <div
        className="absolute top-0 -translate-x-1/2"
        style={{
          width: 280 * size,
          height: 620 * size,
          clipPath: 'polygon(43% 0%, 57% 0%, 100% 100%, 0% 100%)',
          background: 'linear-gradient(180deg, rgba(255,247,225,.5) 0%, rgba(255,247,225,.08) 70%, transparent 100%)',
          filter: 'blur(18px)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute rounded-[100%] -translate-x-1/2"
        style={{
          top: 560 * size,
          width: 260 * size,
          height: 90 * size,
          background: 'radial-gradient(ellipse, rgba(255,247,225,.85) 0%, transparent 72%)',
          filter: 'blur(10px)',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  )
}

/**
 * 커튼 패널 한 폭의 표면. 주름은 SVG path(+ridge/valley 그라데이션)로,
 * 그 위에 4겹 오버레이(세로 falloff·측면 조명·안쪽 선단 하이라이트·비네트)를 얹는다.
 * 이 컴포넌트 전체가 부모 motion.div의 scaleX/x와 함께 통째로 움직인다.
 */
function CurtainPanelSurface({
  folds,
  side,
  showVignette,
}: {
  folds: Fold[]
  side: 'left' | 'right'
  showVignette: boolean
}) {
  const ridgeId = `fold-ridge-${side}`
  const valleyId = `fold-valley-${side}`
  const sideLightStyle: CSSProperties = {
    background:
      side === 'left'
        ? 'linear-gradient(90deg, rgba(0,0,0,.42) 0%, transparent 60%, rgba(255,190,160,.07) 100%)'
        : 'linear-gradient(270deg, rgba(0,0,0,.42) 0%, transparent 60%, rgba(255,190,160,.07) 100%)',
  }
  const leadingEdgeStyle: CSSProperties =
    side === 'left'
      ? { right: 0, background: 'linear-gradient(180deg, transparent 5%, rgba(255,225,190,.45) 50%, transparent 95%)' }
      : { left: 0, background: 'linear-gradient(180deg, transparent 5%, rgba(255,225,190,.45) 50%, transparent 95%)' }

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 200" preserveAspectRatio="none" className="h-full w-full" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={ridgeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A040A" />
            <stop offset="14%" stopColor="#8E1424" />
            <stop offset="52%" stopColor="#C4213A" />
            <stop offset="78%" stopColor="#8E1424" />
            <stop offset="100%" stopColor="#33050C" />
          </linearGradient>
          <linearGradient id={valleyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E0308" />
            <stop offset="16%" stopColor="#4A0810" />
            <stop offset="55%" stopColor="#6E0C18" />
            <stop offset="100%" stopColor="#24040A" />
          </linearGradient>
        </defs>
        {folds.map((f, i) => (
          <path key={i} d={f.d} fill={`url(#${f.type === 'ridge' ? ridgeId : valleyId})`} />
        ))}
      </svg>

      {/* ① 세로 명암 falloff */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 20%, transparent 76%, rgba(0,0,0,.45) 100%)',
        }}
      />
      {/* ② 측면 조명 — 중앙(안쪽)이 밝고 바깥쪽 끝이 어둡게 */}
      <div className="pointer-events-none absolute inset-0" style={sideLightStyle} />
      {/* ③ 안쪽 선단 하이라이트 — 조명이 천 앞단을 스치는 4px 띠 */}
      <div className="pointer-events-none absolute top-0 h-full w-1" style={leadingEdgeStyle} />
      {/* ④ 옅은 비네트 (모바일에서는 생략) */}
      {showVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 65% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.22) 100%)' }}
        />
      )}
    </div>
  )
}

function DebugPanel({
  open,
  onClose,
  progress,
  heroRef,
}: {
  open: boolean
  onClose: () => void
  progress: number
  heroRef: RefObject<HTMLElement>
}) {
  if (!import.meta.env.DEV) return null
  if (!open) return null
  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-40 rounded-lg bg-black/85 p-2.5 text-[10px] text-white/90 backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="tnum font-bold">progress: {progress.toFixed(3)}</p>
        <button onClick={onClose} aria-label="닫기" className="text-white/60 hover:text-white">
          ×
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {DEV_JUMPS.map((jump) => (
          <button
            key={jump.label}
            onClick={() => {
              const el = heroRef.current
              if (!el) return
              const top = el.offsetTop + (el.offsetHeight - window.innerHeight) * jump.value
              window.scrollTo({ top, behavior: 'smooth' })
            }}
            className="rounded border border-white/20 px-1.5 py-0.5 hover:bg-white/10"
          >
            {jump.label} {jump.value}
          </button>
        ))}
      </div>
    </div>
  )
}

function StaticHeroFallback({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section className="relative bg-[#0A0A0D] px-6 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 40% 50% at 50% 0%, rgba(255,247,225,.16) 0%, transparent 70%)' }}
      />
      <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
        <LogoMark dark className="w-[260px] sm:w-[320px]" />
        <p className="mt-6 text-[15px] font-semibold text-white/80">{HERO_TAGLINE}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => onNavigate('/desktop')} className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink">
            웹으로 둘러보기 →
          </button>
          <button onClick={() => onNavigate('/')} className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white">
            모바일 앱 체험하기
          </button>
        </div>
      </div>

      <div className="relative mx-auto mt-16 flex max-w-lg flex-col gap-10">
        {PANELS.map((panel) => (
          <div key={panel.num} className="text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">{panel.role}</p>
            <p className="mt-2 text-2xl font-extrabold text-white">“{panel.quote}”</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">{panel.body}</p>
            <p className="text-gold-text mt-2 text-[15px] font-bold">{panel.solution}</p>
            {panel.withCta && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button onClick={() => onNavigate('/desktop')} className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink">
                  웹으로 둘러보기 →
                </button>
                <button onClick={() => onNavigate('/')} className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white">
                  모바일 앱 체험하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
