import {
  cubicBezier,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { SERVICE_DESCRIPTION } from '@/config/brand'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { CurtainStrip } from './CurtainStrip'
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
  STAGE_BRIGHTNESS_END,
  STAGE_BRIGHTNESS_START,
  TRACK_X_RANGE,
} from './heroTimeline'

const FALL_EASE = cubicBezier(0.55, 0.06, 0.68, 0.19)

interface Panel {
  num: string
  quote: string
  body: string
  solution: string
  withCta?: boolean
}

const PANELS: Panel[] = [
  {
    num: '01',
    quote: '무대가 없다',
    body: '밴드·마술·스탠드업·연극·토론. 재능은 있는데 설 곳이 없습니다.',
    solution: 'NEAR:STAGE는 동네 카페와 바를 무대로 만듭니다.',
  },
  {
    num: '02',
    quote: '손님이 없다',
    body: '한가한 수요일 저녁. 자리는 비어 있고 임대료는 나갑니다.',
    solution: '빈 시간을 공연으로 채워 손님을 데려옵니다. 매칭 수수료 1만원.',
  },
  {
    num: '03',
    quote: '볼 게 없다',
    body: '주말 저녁, 뭘 볼지 검색해도 정식 공연장만 나옵니다.',
    solution: '걸어갈 수 있는 거리의 무대가 지도에 뜹니다.',
    withCta: true,
  },
]

/** 5개의 [입력,입력...] / [출력,출력...] 지점을 한 번에 매핑하는 헬퍼 — 임포트 없이 배열 그대로 useTransform에 전달 */
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
  const [devProgress, setDevProgress] = useState(0)

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  useMotionValueEvent(p, 'change', (v) => {
    if (import.meta.env.DEV) setDevProgress(v)
  })

  // ── 스크롤 유도 ────────────────────────────────────────────────
  const scrollCueOpacity = useTransform(p, [0, 0.02, CURTAIN_CUE_FADE_END], [1, 1, 0])

  // ── 커튼 각인 / 헴 그림자 ──────────────────────────────────────
  const emblemOpacity = useTransform(p, [0, CURTAIN_EMBLEM_FADE_END], [1, 0])
  const hemShadowOpacity = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], [1, 0])

  // ── 무대 밝기 + 착지 흔들림(무대 컨테이너 전용) ─────────────────
  const stageBrightness = useTransform(p, [STAGE_BRIGHTNESS_START, STAGE_BRIGHTNESS_END], [0.28, 1])
  const stageFilter = useTransform(stageBrightness, (b) => `brightness(${b})`)
  const stageShakeY = useTransform(
    p,
    [LANDING_AT, LANDING_AT + (LANDING_SHAKE_END - LANDING_AT) * 0.4, LANDING_AT + (LANDING_SHAKE_END - LANDING_AT) * 0.75, LANDING_SHAKE_END],
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
  const squashStops = [LANDING_AT, LANDING_AT + sq * 0.25, LANDING_AT + sq * 0.55, LANDING_AT + sq * 0.8, LANDING_SQUASH_END]
  const squashScaleY = useTransform(p, squashStops, [1, 0.86, 1.06, 0.97, 1])
  const squashScaleX = useTransform(p, squashStops, [1, 1.14, 0.94, 1.03, 1])

  // ── 2막: 로고 축소 + 좌상단 이동 ─────────────────────────────────
  const act2LogoScale = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], [1, 0.42])
  const act2LogoX = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], ['0vw', '-38vw'])
  const act2LogoY = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], ['0vh', '-32vh'])
  const act2LogoOpacity = useTransform(p, [ACT2_LOGO_SHRINK_START, ACT2_LOGO_SHRINK_END], [1, 0.55])
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
  const act1TextY = useTransform(p, [LANDING_AT, LANDING_SQUASH_END], [16, 0])

  // ── 2막 가로 트랙 ─────────────────────────────────────────────
  const trackX = useTransform(p, [ACT2_START, ACT2_END], TRACK_X_RANGE)

  // 패널 내부 컨텐츠 stagger (훅은 항상 동일한 개수만큼, 조건 없이 호출)
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

  // 진행 인디케이터 — 패널 중앙 근사 지점(트랙 공식 기준 약 0.70 / 0.84 / 0.98)에서 밝아짐
  const dot0 = useTransform(p, [0.56, 0.7, 0.78], [0.3, 1, 0.3])
  const dot1 = useTransform(p, [0.7, 0.84, 0.92], [0.3, 1, 0.3])
  const dot2 = useTransform(p, [0.84, 0.98, 1], [0.3, 1, 1])
  const dots = [dot0, dot1, dot2]

  const heroHeightClass = isMobile ? 'h-[400dvh]' : 'h-[560dvh]'
  const stripCount = isMobile ? 9 : 14

  if (prefersReducedMotion) {
    return <StaticHeroFallback onNavigate={navigate} />
  }

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

        {/* 로고 + 반사 + 먼지 */}
        <div className="absolute inset-0 flex items-end justify-center pb-[18vh]">
          <motion.div
            className="relative"
            style={{
              x: act2LogoX,
              y: act2LogoY,
              willChange: 'transform',
            }}
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
              <LogoMark dark className="w-[280px] sm:w-[380px]" />
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
            <motion.div
              style={{
                y: logoFallY,
                rotate: logoRotate,
                opacity: logoOpacity,
                scale: act2LogoScale,
                willChange: 'transform, opacity',
              }}
            >
              <motion.div
                style={{
                  scaleY: squashScaleY,
                  scaleX: squashScaleX,
                  transformOrigin: 'center bottom',
                  willChange: 'transform',
                }}
              >
                <LogoMark dark className="w-[280px] sm:w-[380px]" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* 1막 타이틀 + 설명 + CTA */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[62%] flex flex-col items-center px-6 text-center"
          style={{ opacity: act1TextOpacity, y: act1TextY }}
        >
          <p className="max-w-md text-[15px] leading-relaxed text-white/70">{SERVICE_DESCRIPTION}</p>
          <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/desktop')}
              className="brand-gradient rounded-full px-7 py-4 text-[15px] font-bold text-white"
              style={{ boxShadow: '0 16px 40px rgba(255,61,119,.4)' }}
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

        {/* 커튼 */}
        <div className="pointer-events-none absolute inset-0 z-40 flex">
          {Array.from({ length: stripCount }, (_, i) => (
            <CurtainStrip key={i} progress={p} index={i} total={stripCount} />
          ))}
        </div>
        {/* 커튼 밸런스(상단 장식 천) + 각인 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[15%] bg-[#7A0F1E]"
          style={{
            clipPath:
              'polygon(0% 0%, 100% 0%, 100% 78%, 92% 100%, 84% 76%, 76% 100%, 68% 76%, 60% 100%, 52% 76%, 48% 76%, 40% 100%, 32% 76%, 24% 100%, 16% 76%, 8% 100%, 0% 78%)',
            boxShadow: '0 6px 18px rgba(0,0,0,.5)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-2 bg-[#C9A227]" />
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[16%] z-40 -translate-x-1/2 text-[#C9A227]"
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
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[15%] z-30 h-10"
          style={{ opacity: hemShadowOpacity, background: 'linear-gradient(180deg, rgba(0,0,0,.55), transparent)' }}
        />

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

        {/* 2막: 가로 트랙 */}
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
                className="relative max-w-lg text-center sm:text-left"
                style={{ opacity: panelContent[i].opacity, y: panelContent[i].y }}
              >
                <p className="text-3xl font-extrabold text-white sm:text-4xl">“{panel.quote}”</p>
                <p className="mt-4 text-[15px] leading-relaxed text-white/70">{panel.body}</p>
                <p className="brand-text mt-3 text-[15px] font-bold">{panel.solution}</p>
                {panel.withCta && (
                  <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <button
                      onClick={() => navigate('/desktop')}
                      className="brand-gradient rounded-full px-7 py-4 text-[15px] font-bold text-white"
                      style={{ boxShadow: '0 16px 40px rgba(255,61,119,.4)' }}
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

        {/* 진행 인디케이터 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center gap-2">
          {dots.map((d, i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#FF5560]"
              style={{ opacity: d }}
            />
          ))}
        </div>

        {import.meta.env.DEV && (
          <DevProgressPanel progress={devProgress} heroRef={ref} />
        )}
      </div>
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
      {/* 바닥 (원근) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[46%]"
        style={{ perspective: '640px', perspectiveOrigin: '50% 0%' }}
      >
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
      {/* 좌우 사이드 커튼(프레임, 걷히지 않음) */}
      <div
        className="absolute inset-y-0 left-0 w-[9%]"
        style={{
          background: 'linear-gradient(90deg, #4A0B12 0%, #6B0F1B 100%)',
          boxShadow: 'inset -18px 0 30px rgba(0,0,0,.6)',
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[9%]"
        style={{
          background: 'linear-gradient(270deg, #4A0B12 0%, #6B0F1B 100%)',
          boxShadow: 'inset 18px 0 30px rgba(0,0,0,.6)',
        }}
      />
      {/* 조명 리그 */}
      <svg
        className="absolute inset-x-0 top-0 h-[8%] w-full opacity-70"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
      >
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
  opacity: MotionValue<number>
  size: number
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0"
      style={{ left: `${xPercent}%`, opacity, willChange: 'opacity' }}
    >
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

function DevProgressPanel({
  progress,
  heroRef,
}: {
  progress: number
  heroRef: RefObject<HTMLElement>
}) {
  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-[60] rounded-lg bg-black/80 p-2.5 text-[10px] text-white/90 backdrop-blur">
      <p className="tnum mb-1.5 font-bold">progress: {progress.toFixed(3)}</p>
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
        style={{
          background: 'radial-gradient(ellipse 40% 50% at 50% 0%, rgba(255,247,225,.16) 0%, transparent 70%)',
        }}
      />
      <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
        <LogoMark dark className="w-[280px] sm:w-[340px]" />
        <p className="mt-6 text-[15px] leading-relaxed text-white/70">{SERVICE_DESCRIPTION}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('/desktop')}
            className="brand-gradient rounded-full px-7 py-4 text-[15px] font-bold text-white"
          >
            웹으로 둘러보기 →
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white"
          >
            모바일 앱 체험하기
          </button>
        </div>
      </div>

      <div className="relative mx-auto mt-16 flex max-w-lg flex-col gap-10">
        {PANELS.map((panel) => (
          <div key={panel.num} className="text-center sm:text-left">
            <p className="text-2xl font-extrabold text-white">“{panel.quote}”</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">{panel.body}</p>
            <p className="brand-text mt-2 text-[15px] font-bold">{panel.solution}</p>
            {panel.withCta && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button
                  onClick={() => onNavigate('/desktop')}
                  className="brand-gradient rounded-full px-7 py-4 text-[15px] font-bold text-white"
                >
                  웹으로 둘러보기 →
                </button>
                <button
                  onClick={() => onNavigate('/')}
                  className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white"
                >
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
