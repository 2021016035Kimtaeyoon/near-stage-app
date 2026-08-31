/**
 * 로고 곡선/글자 좌표를 표로 박아두지 않고, 대칭 각도에서 그때그때 생성합니다.
 * 그래야 좌우 비대칭이 구조적으로 불가능합니다. 아래 PARAMS만 브랜드 자산이며
 * 수정 금지 — 바꾸면 개발 모드 대칭 가드가 즉시 에러를 던집니다.
 */

export const LOGO_VIEWBOX = '0 0 320 176' as const

const CX = 160
const R = 258.05
const CY0 = -125.05
/** 밴드 반두께(밴드 전체 두께 46) */
const H = 23
/** 곡선 양 끝 각도 */
const ARC_SPAN = 30
const ANGLES = [-22, -11, 0, 11, 22] as const
/** 사용 폰트의 캡하이트 실측 비율 */
const CAP_RATIO = 0.75

export const STAGE_FONT_SIZE = 31
export const NEAR = Object.freeze({ x: CX, y: 55, fontSize: 50, letterSpacing: 13 })

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function arcPath(r: number): string {
  const span = toRad(ARC_SPAN)
  const x0 = CX - r * Math.sin(span)
  const y0 = CY0 + r * Math.cos(span)
  const x1 = CX + r * Math.sin(span)
  const cy = 2 * (CY0 + r) - y0
  const f = (n: number) => Number(n.toFixed(2))
  return `M ${f(x0)} ${f(y0)} Q ${CX} ${f(cy)} ${f(x1)} ${f(y0)}`
}

/** 무대 곡선 (장식선 2개의 기준) — 글자는 이 곡선을 "따라가지" 않고 아래 좌표로 고정 배치됩니다 */
export const ARC_UPPER = arcPath(R - H)
export const ARC_LOWER = arcPath(R + H)

interface StageLetter {
  ch: string
  x: number
  y: number
  rot: number
}

function letterAt(theta: number, ch: string): StageLetter {
  const rad = toRad(theta)
  const s = Math.sin(rad)
  const c = Math.cos(rad)
  const centerX = CX + R * s
  const centerY = CY0 + R * c
  const offset = (CAP_RATIO * STAGE_FONT_SIZE) / 2
  const round = (n: number) => Number(n.toFixed(2))
  return Object.freeze({
    ch,
    x: round(centerX + offset * s),
    y: round(centerY + offset * c),
    rot: -theta,
  })
}

/** STAGE — 글자 5개를 곡선 위 대칭 지점에 하나씩, 원호에 수직으로 세워 고정 */
export const STAGE_LETTERS: readonly StageLetter[] = Object.freeze(
  (['S', 'T', 'A', 'G', 'E'] as const).map((ch, i) => letterAt(ANGLES[i], ch)),
)

/* ── 대칭 가드: 좌표가 훼손되면 개발 중에 즉시 터진다 ───────────── */
if (import.meta.env.DEV) {
  const L = STAGE_LETTERS
  const bad = (m: string) => {
    throw new Error(
      `[LogoMark] 로고 좌표가 훼손되었습니다: ${m}\n` +
        `logoGeometry.ts의 PARAMS를 원래 값으로 되돌리세요.`,
    )
  }
  for (let i = 0; i < 2; i++) {
    const a = L[i]
    const b = L[L.length - 1 - i]
    if (Math.abs(a.x - CX + (b.x - CX)) > 0.5) bad(`${a.ch}/${b.ch} 좌우 x 비대칭`)
    if (Math.abs(a.y - b.y) > 0.5) bad(`${a.ch}/${b.ch} 높이 불일치`)
    if (Math.abs(a.rot + b.rot) > 0.5) bad(`${a.ch}/${b.ch} 기울기 비대칭`)
  }
  if (Math.abs(L[2].x - CX) > 0.5 || L[2].rot !== 0) bad('A가 중앙 최저점에 없음')
  const margin = H - (CAP_RATIO * STAGE_FONT_SIZE) / 2
  if (margin < 6) bad(`밴드 여백이 너무 좁습니다 (${margin.toFixed(2)}px)`)
}
