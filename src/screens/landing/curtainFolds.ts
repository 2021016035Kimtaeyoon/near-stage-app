import { makeRng } from '@/lib/rng'

/**
 * 커튼 주름 생성기.
 *
 * 핵심: 주름 하나하나를 "세로 원통"으로 취급합니다. 실제 천은 주름을 **가로질러**
 * 밝기가 변하죠(골=어둠 → 능선=빛 → 골=어둠). 예전 구현은 주름마다 세로 그라데이션을
 * 칠해서 가로로는 색이 일정했고, 그래서 평평한 줄무늬(2D)처럼 보였습니다.
 *
 * 여기서는 기하만 만들고, 색은 CurtainPanelSurface가 주름별 가로 그라데이션으로 칠합니다.
 */

/** 주름 개수 — 사진처럼 촘촘하게. 모바일은 buildFolds 호출부에서 줄입니다 */
export const FOLD_COUNT = 20
export const FOLD_COUNT_MOBILE = 12

export interface Fold {
  /** 주름 실루엣 path */
  d: string
  /** 가로 그라데이션 좌표용 좌우 경계 (하단 기준) */
  x0: number
  x1: number
  /** 빛을 받는 능선의 주름 내 상대 위치 (0~1) */
  crest: number
  /** 주름이 얼마나 깊은지 (0.55~1) — 클수록 골이 어둡고 대비가 큼 */
  depth: number
  /** 이 주름이 빛을 받는 정도의 개체차 (0.86~1.12) — 없으면 명암이 너무 매끄럽게 이어짐 */
  sheen: number
}

interface Boundary {
  /** 하단에서의 x */
  x: number
  /** 상단 x — 배튼에 물려 살짝 모여 있음 */
  xTop: number
  /** 33% / 66% 높이의 제어점 x — 천이 곧게 떨어지지 않고 흔들리게 */
  c1: number
  c2: number
}

/**
 * 주름 경계를 먼저 만들고 그 사이를 주름으로 채웁니다.
 * 경계를 공유해야 인접한 주름이 벌어지거나 겹치지 않고 한 장의 천으로 이어집니다.
 */
function buildBoundaries(count: number, rng: () => number): Boundary[] {
  // 불규칙한 폭 — 균일하면 골판지처럼 보입니다
  const widths = Array.from({ length: count }, () => 0.48 + rng() * 1.12)
  const sum = widths.reduce((a, b) => a + b, 0)

  const boundaries: Boundary[] = []
  let x = 0
  for (let i = 0; i <= count; i++) {
    // 상단은 배튼에 주름이 모여 있어 폭이 좁습니다 (중앙 쪽으로 12% 수축)
    const xTop = 50 + (x - 50) * 0.88
    // 좌우로 흔들리는 정도 — 가운데 높이에서 가장 크게
    const wander = (rng() - 0.5) * 2.6
    boundaries.push({
      x,
      xTop,
      c1: xTop + (x - xTop) * 0.45 + wander,
      c2: x + wander * 0.6,
    })
    if (i < count) x += (widths[i] / sum) * 100
  }
  return boundaries
}

/**
 * 주름 path 목록 생성.
 * @param count  주름 개수
 * @param height viewBox 세로 크기 (기본 200)
 * @param seed   같은 시드면 항상 같은 주름 — 새로고침해도 모양이 안 바뀝니다
 */
export function buildFolds(count: number, height = 200, seed = 'ns-curtain'): Fold[] {
  const rng = makeRng(seed)
  const boundaries = buildBoundaries(count, rng)
  // 밑단은 바닥에 닿아 접히므로, 아래쪽 8%는 늘어진 자락 영역으로 남겨둡니다
  const hemY = height * 0.92

  return Array.from({ length: count }, (_, i) => {
    const a = boundaries[i]
    const b = boundaries[i + 1]
    // 주름마다 처지는 깊이가 달라야 밑단이 일직선으로 보이지 않습니다
    const sag = height * (0.02 + rng() * 0.055)
    const midX = (a.x + b.x) / 2

    const d =
      `M ${a.xTop.toFixed(2)} 0 ` +
      `C ${a.c1.toFixed(2)} ${(height * 0.33).toFixed(1)} ${a.c2.toFixed(2)} ${(height * 0.66).toFixed(1)} ${a.x.toFixed(2)} ${hemY.toFixed(1)} ` +
      `Q ${midX.toFixed(2)} ${(hemY + sag).toFixed(1)} ${b.x.toFixed(2)} ${hemY.toFixed(1)} ` +
      `C ${b.c2.toFixed(2)} ${(height * 0.66).toFixed(1)} ${b.c1.toFixed(2)} ${(height * 0.33).toFixed(1)} ${b.xTop.toFixed(2)} 0 Z`

    return {
      d,
      x0: a.x,
      x1: b.x,
      // 능선이 정확히 가운데 있으면 규칙적으로 보여서 살짝 어긋나게 둡니다
      crest: 0.38 + rng() * 0.26,
      depth: 0.55 + rng() * 0.45,
      sheen: 0.86 + rng() * 0.26,
    }
  })
}

/** 밑단에 뭉친 자락 — 바닥에 닿아 접히는 부분의 어두운 덩어리 */
export interface HemPool {
  cx: number
  cy: number
  rx: number
  ry: number
  dark: number
}

export function buildHemPools(count: number, height = 200, seed = 'ns-curtain-hem'): HemPool[] {
  const rng = makeRng(seed)
  return Array.from({ length: count }, (_, i) => {
    const cx = ((i + 0.5) / count) * 100 + (rng() - 0.5) * 3
    return {
      cx,
      cy: height * (0.945 + rng() * 0.045),
      rx: (100 / count) * (0.5 + rng() * 0.5),
      ry: height * (0.02 + rng() * 0.03),
      dark: 0.2 + rng() * 0.3,
    }
  })
}
