import { makeRng } from '@/lib/rng'

/**
 * 무대 사진의 "분위기" 레이어 — 트러스 조명 리그, 안개를 가르는 조명 빔, 앞줄 관객 실루엣.
 * 전부 시드 기반이라 새로고침해도 카드마다 항상 같은 모양을 유지합니다.
 */

/** 상단 트러스 바 + 조명 기구 — 진짜 공연장 조명 리그처럼 실루엣만 살짝 비칩니다 */
export function StageTruss({ seed }: { seed: string }) {
  const rng = makeRng(`${seed}-truss`)
  const count = 5 + Math.floor(rng() * 2)
  const fixtures = Array.from({ length: count }, (_, i) => {
    const x = 6 + (i / (count - 1)) * 88 + (rng() - 0.5) * 4
    return { x, lit: rng() > 0.4 }
  })
  return (
    <g opacity={0.9}>
      <rect x="1" y="1.6" width="98" height="1.4" rx="0.7" fill="rgba(6,6,8,.6)" />
      {fixtures.map((f, i) => (
        <g key={i}>
          <rect x={f.x - 0.9} y="2.6" width="1.8" height="2.2" rx="0.4" fill="rgba(6,6,8,.65)" />
          {f.lit && <circle cx={f.x} cy="4.6" r="0.9" fill="#FFE9B8" opacity={0.85} />}
        </g>
      ))}
    </g>
  )
}

/** 안개 속을 가르는 조명 빔 — 실제 콘서트 사진의 "갓레이"를 흉내냅니다 */
export function LightBeams({ seed, originX }: { seed: string; originX: number }) {
  const rng = makeRng(`${seed}-beams`)
  const idBase = `beam-${seed.replace(/[^a-zA-Z0-9]/g, '')}`
  const palette = ['201,225,255', '255,220,180', '235,240,255']
  const beams = Array.from({ length: 3 }, (_, i) => {
    const angle = -34 + i * 34 + (rng() - 0.5) * 10
    const rad = (angle * Math.PI) / 180
    const length = 92
    const baseX = originX + Math.tan(rad) * length
    const halfWidth = 3.2 + rng() * 2.6
    const color = palette[Math.floor(rng() * palette.length)]
    return { id: `${idBase}-${i}`, baseX, halfWidth, color, apexX: originX }
  })
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      <defs>
        {beams.map((b) => (
          <linearGradient key={b.id} id={b.id} x1="0" y1="3" x2="0" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`rgba(${b.color},.5)`} />
            <stop offset="100%" stopColor={`rgba(${b.color},0)`} />
          </linearGradient>
        ))}
      </defs>
      {beams.map((b) => (
        <polygon
          key={b.id}
          points={`${b.apexX - 0.8},3 ${b.apexX + 0.8},3 ${b.baseX + b.halfWidth},95 ${b.baseX - b.halfWidth},95`}
          fill={`url(#${b.id})`}
        />
      ))}
    </g>
  )
}

/** 앞줄 관객 실루엣 — 무대를 올려다보는 사람들의 뒤통수·어깨. 화면 맨 앞을 가로막아 "관객석에서 찍은 사진" 시점을 만듭니다 */
export function CrowdSilhouette({ seed }: { seed: string }) {
  const rng = makeRng(`${seed}-crowd`)
  const count = 6 + Math.floor(rng() * 3)
  const heads = Array.from({ length: count }, (_, i) => {
    const x = (i / (count - 1)) * 116 - 8 + (rng() - 0.5) * 12
    const r = 8.5 + rng() * 6.5
    const y = 101 - r * 0.3 + (rng() - 0.5) * 3
    return { x, r, y }
  })
  return (
    <g>
      {heads.map((h, i) => (
        <ellipse key={i} cx={h.x} cy={h.y} rx={h.r} ry={h.r * 1.2} fill="rgba(2,2,4,.94)" />
      ))}
    </g>
  )
}
