/**
 * 랜딩 히어로(FullCurtainHero) 스크롤 타임라인 상수.
 * 전부 0~1 사이의 "히어로 섹션 스크롤 진행률" 기준값입니다.
 * 값을 바꾸면 타이밍이 바뀝니다 — 자세한 설명은 ANIMATION.md 참고.
 *
 * 로고가 가운데서 정지해 있는 "숨 고르기" 구간(ACT1_HOLD_*)을 한 번 더 늘리면서,
 * 그 뒤로 오는 모든 값을 같은 비율로 다시 계산했습니다(절대 스크롤 거리는 유지한 채
 * 숨 고르기 구간만 더 길어지도록). hero/FullCurtainHero.tsx의 heroHeightClass도 같은 비율로
 * 늘려야 실제 스크롤 체감 속도가 유지됩니다.
 */

export const HERO_TAGLINE = '오늘 밤, 걸어갈 수 있는 무대'

// 1막 — 개막
export const CURTAIN_CUE_FADE_END = 0.0556
export const CURTAIN_OPEN_START = 0.0463
export const CURTAIN_OPEN_END = 0.2407
export const CURTAIN_EMBLEM_FADE_END = 0.1111
/** 좌우 패널이 각자 바깥쪽 끝을 축으로 오그라드는 최종 scaleX */
export const PANEL_SCALE_END = 0.34
/** 오그라드는 동안 함께 바깥으로 밀려나는 x 이동량(%) */
export const PANEL_X_END = 6
/**
 * 좌우 패널이 바깥쪽 끝(벽 쪽)을 경첩 삼아 무대 뒤로 젖혀지는 3D 회전각(도).
 * perspective와 함께 써야 실제로 깊이가 생깁니다 — 없으면 그냥 눌린 것처럼 보입니다.
 * 모바일은 화면이 좁아 왜곡이 과해 보여서 더 작은 값을 씁니다(FullCurtainHero.tsx).
 */
export const PANEL_ROTATE_Y_END = 34
export const PANEL_ROTATE_Y_END_MOBILE = 20
/**
 * 열리면서 무대 안쪽(뒤)으로 물러나는 깊이(px). rotateY 와 함께 써야 "젖혀지며
 * 뒤로 밀려난다"가 되고, 없으면 제자리에서 회전만 하는 문처럼 보입니다.
 */
export const PANEL_Z_END = -180
/** 천이 조명에서 등을 돌리며 어두워지는 최대 농도 (0~1) */
export const PANEL_TURN_SHADE = 0.55

/** 로고가 뒤(깊이)에서 앞으로 날아오는 시작 z(px) — 낙하와 함께 적용 */
export const LOGO_Z_START = -620
/** 낙하 중 살짝 앞으로 기울었다가(위에서 내려다보는 각) 펴지는 각도 */
export const LOGO_ROTATE_X_START = 26

/** 밸런스(상단 장식 천) — 절대 px 단위. 화면이 넓어지면 개수만 늘어남 */
export const VALANCE_HEIGHT = 72
export const SCALLOP_TILE = 80
export const SCALLOP_DEPTH = 14

export const STAGE_REVEAL_START = 0.1852
export const STAGE_REVEAL_END = 0.2963
export const STAGE_BRIGHTNESS_START = STAGE_REVEAL_START
export const STAGE_BRIGHTNESS_END = 0.3704

export const LIGHTS_START = 0.2685
export const LIGHTS_END = 0.3704
export const LIGHT_LEFT_RANGE: [number, number] = [0.2685, 0.3241]
export const LIGHT_RIGHT_RANGE: [number, number] = [0.3056, 0.3611]
export const LIGHT_CENTER_RANGE: [number, number] = [0.3148, 0.3704]

export const LOGO_FALL_START = 0.3519
export const LOGO_FALL_END = 0.463
/** 낙하 중 로고가 완전히 보이게 되는 시점 — 낙하 시작 직후 빠르게 페이드인 */
export const LOGO_FADE_IN_END = 0.3889

export const LANDING_AT = LOGO_FALL_END // 0.463
export const LANDING_SQUASH_END = 0.5046
export const LANDING_DUST_END = 0.6296
export const LANDING_SHAKE_END = 0.5
export const LANDING_FLASH_END = 0.4907

/** 로고+태그라인+CTA가 멈춰 있는 "숨 고르기" 구간 — 여기를 늘리면 2막으로 넘어가기 전 더 오래 머무름 */
export const ACT1_HOLD_START = 0.463
export const ACT1_HOLD_END = 0.6296

// 2막 — 가로 트랙
export const ACT2_START = 0.6296
export const ACT2_END = 0.9722
export const ACT2_TAIL_END = 1.0
/** 로고 축소·좌상단 이동 + 1막 카피 페이드아웃 — 같은 구간 */
export const ACT2_LOGO_SHRINK_START = 0.6296
export const ACT2_LOGO_SHRINK_END = 0.6852
export const ACT1_TITLE_FADEOUT_START = 0.6296
export const ACT1_TITLE_FADEOUT_END = 0.6852

/** 트랙 x좌표 매핑 — 공식 그대로. 패널 중앙 도달 시점은 근사치(약 0.74/0.86/0.97) */
export const TRACK_X_RANGE: [string, string] = ['100vw', '-200vw']

/** 패널 내부 텍스트가 패널 자체보다 살짝 늦게 따라오는 구간 (패널당) */
export const PANEL_CONTENT_WINDOWS: Array<[number, number]> = [
  [0.6787, 0.7574],
  [0.7935, 0.8722],
  [0.9074, 0.9861],
]

// 개발용 진행률 패널 점프 버튼
export const DEV_JUMPS: Array<{ label: string; value: number }> = [
  { label: '닫힘', value: 0.0185 },
  { label: '커튼', value: 0.1389 },
  { label: '무대', value: 0.2778 },
  { label: '조명', value: 0.3241 },
  { label: '착지', value: 0.4722 },
  { label: '패널1', value: 0.7407 },
  { label: '패널2', value: 0.8611 },
  { label: '패널3', value: 0.9722 },
]
