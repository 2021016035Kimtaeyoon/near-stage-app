import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { seedDots, seedGradient, seedGradientDeep } from '@/lib/gradient'
import { GENRE_GLYPH } from '@/lib/theme'
import type { Genre } from '@/types'

/**
 * 모든 "사진"은 photoSeed에서 계산한 그라데이션 + 장르 픽토그램으로 대체합니다.
 * 외부 이미지 요청이 0건이라 오프라인에서도 절대 깨지지 않습니다.
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
  const dots = seedDots(seed, 14)

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundImage: deep ? seedGradientDeep(seed) : g.css }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff" opacity={d.o} />
        ))}
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: `${44 * glyphScale}%`, height: `${44 * glyphScale}%` }}
        fill="none"
        stroke="rgba(255,255,255,.78)"
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={GENRE_GLYPH[genre]} />
      </svg>
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
