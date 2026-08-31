/**
 * 커튼 주름 생성기. 폭 배열을 하드코딩된 좌표로 박아두지 않고 100 단위로
 * 정규화해 path를 그때그때 만듭니다 — 여기 두 배열(FOLD_WIDTHS, FOLD_TYPES)이
 * 조절 손잡이입니다.
 */

/** 주름 16개의 상대 폭 — 일부러 불규칙 (합 110 → buildFolds에서 100으로 정규화) */
export const FOLD_WIDTHS: number[] = [7, 5, 8, 6, 9, 5, 7, 6, 8, 5, 7, 9, 6, 8, 5, 9]

/** 능선(ridge)/골(valley) 배치 — 규칙적으로 교대하지 않도록 일부러 섞음 */
export const FOLD_TYPES: Array<'ridge' | 'valley'> = [
  'ridge',
  'valley',
  'ridge',
  'ridge',
  'valley',
  'ridge',
  'valley',
  'valley',
  'ridge',
  'valley',
  'ridge',
  'ridge',
  'valley',
  'ridge',
  'valley',
  'valley',
]

export interface Fold {
  d: string
  type: 'ridge' | 'valley'
}

/**
 * 주름 path 목록 생성. 상단은 5% 좁게(배튼에 물려 드레이프가 생기도록),
 * 하단은 Q커브로 주름마다 살짝 처지는 스캘럽이 되도록 그립니다.
 */
export function buildFolds(widths: number[], types: Array<'ridge' | 'valley'>, height = 200): Fold[] {
  const sum = widths.reduce((a, b) => a + b, 0)
  const scale = sum > 0 ? 100 / sum : 1
  const bottomY = height * 0.965
  let x = 0
  return widths.map((w, i) => {
    const width = w * scale
    const x0 = x
    const x1 = x + width
    x = x1
    const inset = width * 0.05
    const x0t = x0 + inset / 2
    const x1t = x1 - inset / 2
    const midX = (x0 + x1) / 2
    const d =
      `M ${x0t.toFixed(2)} 0 L ${x1t.toFixed(2)} 0 ` +
      `L ${x1.toFixed(2)} ${bottomY.toFixed(2)} Q ${midX.toFixed(2)} ${height} ${x0.toFixed(2)} ${bottomY.toFixed(2)} Z`
    return { d, type: types[i % types.length] }
  })
}
