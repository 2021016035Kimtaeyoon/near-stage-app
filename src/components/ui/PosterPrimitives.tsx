export const POSTER_SILHOUETTE = 'rgba(10,7,4,.62)'

/** 공통 인물 실루엣 — 머리 + 코트처럼 아래로 퍼지는 몸통 */
export function Person({ cx = 50 }: { cx?: number }) {
  const dx = cx - 50
  return (
    <>
      <circle cx={50 + dx} cy="44.5" r="4.6" fill={POSTER_SILHOUETTE} />
      <path
        d={`M${50 + dx},48.8 C${46.6 + dx},48.8 ${43.8 + dx},50.6 ${42.5 + dx},53.4 L${39.6 + dx},79.6 C${46 + dx},82.7 ${54 + dx},82.7 ${60.4 + dx},79.6 L${57.5 + dx},53.4 C${56.2 + dx},50.6 ${53.4 + dx},48.8 ${50 + dx},48.8 Z`}
        fill={POSTER_SILHOUETTE}
      />
    </>
  )
}

export function Limb({ d }: { d: string }) {
  return <path d={d} stroke={POSTER_SILHOUETTE} strokeWidth={4.2} strokeLinecap="round" fill="none" />
}
