import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { seedDots, seedGradient, seedGradientDeep } from '@/lib/gradient'
import { makeRng } from '@/lib/rng'
import { GENRE_GLYPH } from '@/lib/theme'
import { POSTER_FIGURE } from './PosterFigures'
import type { Genre } from '@/types'

/**
 * 모든 "사진"은 photoSeed에서 계산한 무대 조명 장면(그라데이션 + 스포트라이트 + 실루엣
 * 연주자)으로 대체합니다. 외부 이미지 요청이 0건이라 오프라인에서도 절대 깨지지 않습니다.
 */
export function PosterArt({
  seed,
  genre,
  className,
  deep = false,
  glyphScale = 1,
  overlay,
}: {
  seed: string
  genre: Genre
  className?: string
  deep?: boolean
  glyphScale?: number
  overlay?: React.ReactNode
}) {
  const g = seedGradient(seed)
  const dots = seedDots(seed, 10)
  const rng = makeRng(`${seed}-scene`)
  const mirror = rng() > 0.5
  const jitterX = -3 + rng() * 6
  const scale = 0.5 + (glyphScale - 1) * 0.15

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundImage: deep ? seedGradientDeep(seed) : g.css }}
      aria-hidden
    >
      {/* 스포트라이트 — 인물 뒤에서 비추는 무대 조명 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at ${g.glowX}% ${Math.max(8, g.glowY - 12)}%, rgba(255,242,210,.38), rgba(255,242,210,0) 68%)`,
        }}
      />
      {/* 바닥 그림자 — 무대 바닥에 깔리는 어둠 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34%]"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 100%)' }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 h-full w-full"
      >
        {/* 보케 — 흐릿한 조명 알갱이 */}
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y * 0.62} r={d.r * 2.4} fill="#FCE3AC" opacity={d.o * 0.55} />
            <circle cx={d.x} cy={d.y * 0.62} r={d.r * 0.9} fill="#FFF3D9" opacity={Math.min(0.5, d.o * 1.8)} />
          </g>
        ))}
        {/* 장르 실루엣 — 무대 바닥(y=82) 기준으로 축소해, 조명 아래 서 있는 작은 인물처럼 보이게 합니다 */}
        <g
          transform={`translate(${jitterX} 0) ${mirror ? 'translate(100 0) scale(-1 1)' : ''} translate(50 82) scale(${scale}) translate(-50 -82)`}
        >
          {POSTER_FIGURE[genre]}
        </g>
      </svg>
      {/* 비네트 — 가장자리를 살짝 눌러 사진처럼 */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 100% at 50% 42%, transparent 55%, rgba(0,0,0,.3) 100%)' }}
      />
      {overlay}
    </div>
  )
}

/** 장르 픽토그램만 (마커·아바타용) */
export function GenreGlyph({
  genre,
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.6,
}: {
  genre: Genre
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={GENRE_GLYPH[genre]} />
    </svg>
  )
}

/** 팀/공간 아바타 */
export function SeedAvatar({
  seed,
  genre,
  size = 44,
  className,
}: {
  seed: string
  genre: Genre
  size?: number
  className?: string
}) {
  const g = seedGradient(seed)
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, backgroundImage: g.css }}
      aria-hidden
    >
      <GenreGlyph genre={genre} size={size * 0.46} color="rgba(255,255,255,.86)" />
    </div>
  )
}

export function Rating({
  value,
  count,
  size = 12,
}: {
  value: number
  count?: number
  size?: number
}) {
  return (
    <span className="inline-flex items-center gap-1 text-ink-2">
      <Star size={size} className="fill-warn text-warn" />
      <span className="tnum text-xs font-bold text-ink">{value.toFixed(1)}</span>
      {count !== undefined && <span className="tnum text-2xs text-ink-3">({count})</span>}
    </span>
  )
}

/** 별점 입력 */
export function RatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className="tap flex items-center justify-center"
        >
          <Star
            size={28}
            className={n <= value ? 'fill-warn text-warn' : 'fill-transparent text-border-strong'}
          />
        </button>
      ))}
    </div>
  )
}
