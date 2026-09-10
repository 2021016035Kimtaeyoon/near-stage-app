import {
  cubicBezier,
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useAppNavigate } from '@/lib/appLink'
import { LogoMark } from '@/components/shell/LogoMark'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { CURTAIN_IMAGE, CURTAIN_IMAGE_HEIGHT, CurtainPanelSurface, SpotLight, StageBackdrop } from './stageParts'
import {
  ACT1_TITLE_FADEOUT_END,
  ACT1_TITLE_FADEOUT_START,
  ACT1_HOLD_END,
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
} from '../heroTimeline'

const FALL_EASE = cubicBezier(0.55, 0.06, 0.68, 0.19)
const DEBUG_STORAGE_KEY = 'ns-hero-debug'

/**
 * 밸런스(위 스캘럽 띠) 모양을 CSS mask-image 로 자르기 위한 데이터 URI.
 * SVG <mask> + 오버사이즈 <image> 조합이 렌더링 버그를 내서(위 주석 참고) 이 방식으로
 * 바꿨습니다 — 타일 하나(SCALLOP_TILE × VALANCE_HEIGHT)만큼만 그려서 반복(repeat-x)합니다.
 */
const SCALLOP_MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='${SCALLOP_TILE}' height='${VALANCE_HEIGHT}'><path d='M0,0 H${SCALLOP_TILE} V${VALANCE_HEIGHT - SCALLOP_DEPTH} Q${SCALLOP_TILE / 2},${VALANCE_HEIGHT} 0,${VALANCE_HEIGHT - SCALLOP_DEPTH} Z' fill='#fff'/></svg>`,
)}")`

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
/**
 * @param act1Only 1막(커튼 개막 → 로고 낙하 → 숨 고르기)까지만 재생합니다.
 *
 * ★ 랜딩은 방문자를 빨리 다음 행동으로 보내야 하는데, 2막 가로 트랙까지 605dvh 를
 *   스크롤하게 만들면 대부분 그전에 떠납니다. 그래서 커튼이 열리고 로고가 떨어지는
 *   부분만 쓰고 나머지는 재생하지 않습니다.
 *
 * ★ 타임라인 상수를 건드리지 않고 "진행률을 1막 범위로 다시 매핑"합니다.
 *   섹션 높이만 줄이면 커튼이 순식간에 열려버리고, 상수를 나누면 ANIMATION.md 의
 *   설명과 코드가 어긋납니다. 이 방식은 1막 계산이 한 줄도 바뀌지 않습니다.
 */
export function FullCurtainHero({ act1Only = false }: { act1Only?: boolean } = {}) {
  const go = useAppNavigate()
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
  const { scrollYProgress: rawP } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  // 1막만 쓸 때는 스크롤 0~1 을 0~ACT1_HOLD_END 로 압축합니다. 아래 모든 1막
  // 계산이 원래 값 그대로 동작하고, 2막 구간은 도달하지 않습니다.
  const p = useTransform(rawP, [0, 1], [0, act1Only ? ACT1_HOLD_END : 1])

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
  //
  // ★ 원래는 scaleX 와 x 를 같은 구간에서 같은 이징으로만 움직여서, 딱딱한 판이
  //   미끄러지는 것처럼 보였습니다(흔들림·무게감 없음). 실제 커튼은
  //   1) 안쪽 자락이 트랙 쪽으로 먼저 오그라들며 느슨해지고(오그라듦이 이동보다 먼저)
  //   2) 위쪽(고리로 트랙에 걸린 부분)이 아래쪽(바닥에 끌리는 부분)보다 먼저 움직여
  //      순간적으로 비스듬히 기울고
  //   3) 다 열리기 직전에 관성으로 한 번 더 살짝 흔들리다 멈춥니다.
  //   아래 세 가지로 그 느낌만 흉내 냅니다 — 물리 시뮬레이션이 아니라 스크롤 진행률
  //   p 의 함수라 스크롤을 거꾸로 해도 정확히 거꾸로 재생됩니다.
  const CURTAIN_WEIGHT_EASE = cubicBezier(0.65, 0, 0.35, 1) // 초반에 더 버티는, 무게감 있는 이징
  const GATHER_LAG = (CURTAIN_OPEN_END - CURTAIN_OPEN_START) * 0.14
  const DRAG_LAG_DEG = 4.5 // 위·아래가 벌어지는 정도(도) — 열리는 중간에만 나타났다 사라짐
  const SWAY_PCT = 1.4 // 다 열릴 무렵 한 번 더 흔들리는 폭(%)

  const panelScaleX = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], [1, PANEL_SCALE_END], {
    ease: CURTAIN_WEIGHT_EASE,
  })

  // 진행률(0~1)만 따로 뽑아둡니다 — 흔들림·기울기가 "열리는 구간 안에서 몇 %"인지로
  // 계산되어야, 다른 구간(숨 고르기 등)에는 전혀 새어나가지 않습니다.
  const openT = useTransform(p, [CURTAIN_OPEN_START, CURTAIN_OPEN_END], [0, 1])

  // 위아래 기울어짐 — 0에서 시작해 중간에 가장 크게, 다시 0으로. sin(π·t) 모양이라
  // 양 끝(닫힘·다 열림)에서는 정확히 0이라 이질감 없이 시작·종료합니다.
  const dragLag = useTransform(openT, (t) => Math.sin(Math.min(Math.max(t, 0), 1) * Math.PI) * DRAG_LAG_DEG)
  const skewLeft = dragLag
  const skewRight = useTransform(dragLag, (v) => -v)

  const leftPanelBaseX = useTransform(
    p,
    [CURTAIN_OPEN_START + GATHER_LAG, CURTAIN_OPEN_END],
    ['0%', `-${PANEL_X_END}%`],
    { ease: CURTAIN_WEIGHT_EASE },
  )
  const rightPanelBaseX = useTransform(
    p,
    [CURTAIN_OPEN_START + GATHER_LAG, CURTAIN_OPEN_END],
    ['0%', `${PANEL_X_END}%`],
    { ease: CURTAIN_WEIGHT_EASE },
  )
  // 다 열리기 직전(0.75~1 구간)에 한 번 더 출렁이다 정확히 0으로 잦아듭니다.
  const settleSway = useTransform(openT, (t) => {
    const c = Math.min(Math.max(t, 0), 1)
    if (c < 0.6) return 0
    const local = (c - 0.6) / 0.4 // 0~1
    return Math.sin(local * Math.PI * 2.2) * SWAY_PCT * (1 - local)
  })
  const leftPanelX = useMotionTemplate`calc(${leftPanelBaseX} + ${settleSway}%)`
  const rightPanelX = useMotionTemplate`calc(${rightPanelBaseX} - ${settleSway}%)`
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
  const heroHeightClass = act1Only
    ? isMobile
      ? 'h-[272dvh]'
      : 'h-[381dvh]'
    : isMobile
      ? 'h-[432dvh]'
      : 'h-[605dvh]'

  if (prefersReducedMotion) {
    return <StaticHeroFallback onNavigate={go} />
  }

  const logoWidthClass = isMobile ? 'w-[220px]' : shortViewport ? 'w-[260px]' : 'w-[330px]'
  const gapClass = shortViewport ? 'gap-6' : 'gap-10'
  const ctaGapClass = shortViewport ? 'mt-4' : 'mt-7'

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
                onClick={() => go('/')}
                className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink"
                style={{ boxShadow: '0 16px 40px rgba(255,196,46,.4)' }}
              >
                지금 둘러보기 →
              </button>
            </div>
          </motion.div>
        </div>

        {/* 2막: 가로 트랙 (반드시 sticky 컨테이너 안, pointer-events 살아있음).
            ★ act1Only 에서는 아예 렌더하지 않습니다 — 투명해도 포인터를 먹어서
            1막 CTA 가 안 눌립니다. */}
        <motion.div
          className="absolute inset-0 z-20 flex"
          style={{ x: trackX, willChange: 'transform', display: act1Only ? 'none' : undefined }}
        >
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
                      onClick={() => go('/')}
                      className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink"
                      style={{ boxShadow: '0 16px 40px rgba(255,196,46,.4)' }}
                    >
                      지금 둘러보기 →
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
            className="absolute left-0 top-0 h-full w-[52%]"
            style={{
              scaleX: panelScaleX,
              x: leftPanelX,
              skewX: skewLeft,
              transformOrigin: 'left top',
              willChange: 'transform',
            }}
          >
            <CurtainPanelSurface side="left" showVignette={!isMobile} />
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute right-0 top-0 h-full w-[52%]"
            style={{
              scaleX: panelScaleX,
              x: rightPanelX,
              skewX: skewRight,
              transformOrigin: 'right top',
              willChange: 'transform',
            }}
          >
            <CurtainPanelSurface side="right" showVignette={!isMobile} />
          </motion.div>
          {/* 중앙 이음새 — 닫혔을 때 두 폭이 맞물린 것처럼 보이게, 열리며 함께 사라짐 */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-1/2 w-[10px] -translate-x-1/2"
            style={{
              opacity: seamOpacity,
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,.5), transparent)',
              maskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 82%)',
              WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 82%)',
            }}
          />
        </div>

        {/* 밸런스 — 커튼 사진 윗단을 스캘럽 모양으로 잘라 씁니다 (화면이 넓어지면 스캘럽 개수만 늘어남).
            ★ 예전엔 SVG <image> 를 밸런스 높이(72px)보다 훨씬 크게(뷰포트 배율로) 그린 뒤
            SVG mask 로 잘라 썼는데, 그 조합(아주 큰 <image> 를 아주 작은 mask 로 자르기)이
            일부 브라우저에서 그 레이어 전체가 흰 화면으로 그려지는 렌더링 버그를 냈습니다
            (경계선 버그를 고치려다 새로 만든 버그입니다 — 열리는 애니메이션 중간 지점에서만
            재현되어 뒤늦게 발견했습니다). 그래서 본판(CurtainPanelSurface)과 똑같은 방식 —
            평범한 HTML div 에 CSS background-size 로 사진을 늘리는 방식 — 으로 바꿨습니다.
            이 방식은 본판에서 이미 같은 배율(CURTAIN_IMAGE_HEIGHT)로 문제없이 쓰고 있습니다.
            스캘럽 모양은 CSS mask-image(데이터 URI)로 별도로 자릅니다. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40" style={{ height: VALANCE_HEIGHT }}>
          {/* 사진+그늘만 스캘럽 모양으로 자릅니다. 금색 테두리·엠블럼은 이 바깥(아래)에 둬서
              마스크의 영향을 받지 않는, 늘 깔끔한 직선/텍스트로 남습니다. */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              WebkitMaskImage: SCALLOP_MASK_URL,
              maskImage: SCALLOP_MASK_URL,
              WebkitMaskRepeat: 'repeat-x',
              maskRepeat: 'repeat-x',
              WebkitMaskSize: `${SCALLOP_TILE}px ${VALANCE_HEIGHT}px`,
              maskSize: `${SCALLOP_TILE}px ${VALANCE_HEIGHT}px`,
            }}
          >
            {/* 왼쪽 폭 — CurtainPanelSurface(left)와 완전히 같은 배율·기준점 */}
            <div
              className="absolute left-0 top-0 h-full w-[52%]"
              style={{
                backgroundImage: `url(${CURTAIN_IMAGE})`,
                backgroundSize: `200% ${CURTAIN_IMAGE_HEIGHT}`,
                backgroundPosition: 'left top',
                backgroundRepeat: 'no-repeat',
              }}
            />
            {/* 오른쪽 폭 — 뒤에 그려서 가운데 겹침 구간(4%)은 이 쪽이 덮습니다(본판과 동일) */}
            <div
              className="absolute right-0 top-0 h-full w-[52%]"
              style={{
                backgroundImage: `url(${CURTAIN_IMAGE})`,
                backgroundSize: `200% ${CURTAIN_IMAGE_HEIGHT}`,
                backgroundPosition: 'right top',
                backgroundRepeat: 'no-repeat',
              }}
            />
            {/* 밸런스는 조명보다 위라 커튼 본체보다 한 단계 어둡습니다. 아래쪽(본판과 맞닿는
                경계)은 0으로 — 본판이 자기 윗단에 이미 같은 종류의 그늘을 지고 있어서, 여기서
                한 번 더 어둡게 하면 사진이 이어져도 밝기 차이로 경계가 다시 도드라집니다. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.2) 55%, rgba(0,0,0,0) 100%)',
              }}
            />
          </div>
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
          {/* 예전에는 '웹으로 둘러보기'와 '모바일 앱 체험하기'가 따로였습니다. 이제는
              화면 크기를 보고 알아서 고르므로 버튼 하나로 충분합니다 */}
          <button onClick={() => onNavigate('/')} className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink">
            지금 둘러보기 →
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
                <button onClick={() => onNavigate('/')} className="bg-gold-500 rounded-full px-7 py-4 text-[15px] font-bold text-gold-ink">
                  지금 둘러보기 →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
