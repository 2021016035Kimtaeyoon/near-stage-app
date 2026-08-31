/**
 * 랜딩 히어로(DarkStageHero) 스크롤 타임라인 상수.
 * 전부 0~1 사이의 "히어로 섹션 스크롤 진행률" 기준값입니다.
 * 값을 바꾸면 타이밍이 바뀝니다 — 자세한 설명은 ANIMATION.md 참고.
 */

// 1막 — 개막
export const CURTAIN_CUE_FADE_END = 0.06
export const CURTAIN_OPEN_START = 0.05
export const CURTAIN_OPEN_END = 0.26
/** 조각별 시작 지연의 최댓값(중앙 조각) — 진행률 단위 */
export const CURTAIN_STAGGER_MAX = 0.09
/** 조각 1개가 스스로 움직이는 데 걸리는 진행률 폭 */
export const CURTAIN_STRIP_DURATION = CURTAIN_OPEN_END - CURTAIN_OPEN_START - CURTAIN_STAGGER_MAX
export const CURTAIN_EMBLEM_FADE_END = 0.12

export const STAGE_REVEAL_START = 0.2
export const STAGE_REVEAL_END = 0.32
export const STAGE_BRIGHTNESS_START = STAGE_REVEAL_START
export const STAGE_BRIGHTNESS_END = 0.4

export const LIGHTS_START = 0.29
export const LIGHTS_END = 0.4
export const LIGHT_LEFT_RANGE: [number, number] = [0.29, 0.35]
export const LIGHT_RIGHT_RANGE: [number, number] = [0.33, 0.39]
export const LIGHT_CENTER_RANGE: [number, number] = [0.34, 0.4]

export const LOGO_FALL_START = 0.38
export const LOGO_FALL_END = 0.5
/** 낙하 중 로고가 완전히 보이게 되는 시점 — 낙하 시작 직후 빠르게 페이드인 */
export const LOGO_FADE_IN_END = 0.42

export const LANDING_AT = LOGO_FALL_END // 0.50
export const LANDING_SQUASH_END = 0.545
export const LANDING_DUST_END = 0.6
export const LANDING_SHAKE_END = 0.54
export const LANDING_FLASH_END = 0.53

export const ACT1_HOLD_START = 0.5
export const ACT1_HOLD_END = 0.56

// 2막 — 가로 트랙
export const ACT2_START = 0.56
export const ACT2_END = 0.98
export const ACT2_TAIL_END = 1.0
/** 1막 타이틀/CTA 페이드아웃, 로고 축소·이동 구간 */
export const ACT2_LOGO_SHRINK_START = 0.56
export const ACT2_LOGO_SHRINK_END = 0.64
export const ACT1_TITLE_FADEOUT_START = 0.56
export const ACT1_TITLE_FADEOUT_END = 0.62

/** 트랙 x좌표 매핑 — 공식 그대로. 패널 중앙 도달 시점은 근사치(약 0.70/0.84/0.98) */
export const TRACK_X_RANGE: [string, string] = ['100vw', '-200vw']

/** 패널 내부 텍스트가 패널 자체보다 살짝 늦게 따라오는 구간 (패널당) */
export const PANEL_CONTENT_WINDOWS: Array<[number, number]> = [
  [0.6, 0.68],
  [0.74, 0.82],
  [0.88, 0.97],
]

// 개발용 진행률 패널 점프 버튼
export const DEV_JUMPS: Array<{ label: string; value: number }> = [
  { label: '닫힘', value: 0.02 },
  { label: '커튼', value: 0.15 },
  { label: '무대', value: 0.3 },
  { label: '조명', value: 0.35 },
  { label: '착지', value: 0.51 },
  { label: '패널1', value: 0.65 },
  { label: '패널2', value: 0.79 },
  { label: '패널3', value: 0.95 },
]
