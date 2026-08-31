/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ⚠️  이 파일의 숫자는 확정된 브랜드 자산입니다. 수정 금지.        ║
 * ║                                                              ║
 * ║  STAGE 글자는 곡선 위에 좌우 대칭으로 손으로 배치한 좌표입니다.   ║
 * ║  textPath / startOffset / letterSpacing 로 다시 구현하지 마세요.║
 * ║  그 방식은 폰트 메트릭에 따라 위치가 밀려 로고가 삐뚤어집니다.     ║
 * ║                                                              ║
 * ║  로고 크기 변경은 className(w-[...])으로만 하세요.               ║
 * ║  아래 값을 바꾸면 개발 모드에서 즉시 에러가 발생합니다.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export const LOGO_VIEWBOX = '0 0 336 260' as const
/** 대칭 기준선 — viewBox 가로의 정중앙 */
export const CENTER_X = 168

/** NEAR — 곧게, 중앙 정렬 */
export const NEAR = Object.freeze({
  x: CENTER_X, y: 100, fontSize: 50, letterSpacing: 13,
})

/** 무대 곡선 (장식선 2개의 기준). 글자는 이 곡선을 "따라가지" 않고 아래 좌표로 고정 배치됩니다. */
export const ARC_UPPER = 'M 58 118 Q 168 172 278 118'
export const ARC_LOWER = 'M 26 150 Q 168 226 310 150'

/** STAGE — 글자 5개를 곡선 위 대칭 지점에 하나씩 고정 */
export const STAGE_FONT_SIZE = 34
export const STAGE_LETTERS = Object.freeze([
  Object.freeze({ ch: 'S', x: 64.7,  y: 144.7, rot:  22.9 }),
  Object.freeze({ ch: 'T', x: 116.3, y: 161.0, rot:  11.9 }),
  Object.freeze({ ch: 'A', x: 168.0, y: 166.5, rot:   0.0 }),
  Object.freeze({ ch: 'G', x: 219.7, y: 161.0, rot: -11.9 }),
  Object.freeze({ ch: 'E', x: 271.3, y: 144.7, rot: -22.9 }),
])

/* ── 대칭 가드: 좌표가 훼손되면 개발 중에 즉시 터진다 ───────────── */
if (import.meta.env.DEV) {
  const L = STAGE_LETTERS
  const bad = (m: string) => {
    throw new Error(
      `[LogoMark] 로고 좌표가 훼손되었습니다: ${m}\n` +
        `logoGeometry.ts의 STAGE_LETTERS를 원래 값으로 되돌리세요. ` +
        `크기 조절은 className(w-[...])으로만 하세요.`,
    )
  }
  for (let i = 0; i < 2; i++) {
    const a = L[i]
    const b = L[L.length - 1 - i]
    if (Math.abs(a.x - CENTER_X + (b.x - CENTER_X)) > 0.5) bad(`${a.ch}/${b.ch} 좌우 x 비대칭`)
    if (Math.abs(a.y - b.y) > 0.5) bad(`${a.ch}/${b.ch} 높이 불일치`)
    if (Math.abs(a.rot + b.rot) > 0.5) bad(`${a.ch}/${b.ch} 기울기 비대칭`)
  }
  if (Math.abs(L[2].x - CENTER_X) > 0.5 || L[2].rot !== 0) bad('A가 중앙 최저점에 없음')
}
