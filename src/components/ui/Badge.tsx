import { Landmark, Sparkles } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { GENRE_COLOR, alpha, darken } from '@/lib/theme'
import type { Genre, ShowSource } from '@/types'

/**
 * ★ 서비스의 핵심 구분: `우리 무대` vs `등록 공연`
 * 색상만으로 구분하지 않고 항상 텍스트 라벨을 함께 노출합니다(접근성).
 */
export function SourceBadge({
  source,
  size = 'md',
}: {
  source: ShowSource
  size?: 'sm' | 'md'
}) {
  const sm = size === 'sm'
  if (source === 'own') {
    return (
      <span
        className={cn(
          'bg-gold-500 inline-flex items-center gap-1 rounded-full font-bold text-gold-ink',
          sm ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
        )}
      >
        <Sparkles size={sm ? 10 : 12} strokeWidth={2.6} />
        우리 무대
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-2 font-semibold text-ink-2',
        sm ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
      )}
    >
      <Landmark size={sm ? 10 : 12} strokeWidth={2.2} />
      등록 공연
    </span>
  )
}

/**
 * 장르 배지.
 *
 * `genre` 가 null 이면 우리 장르 목록에 없는 분류입니다(등록 공연의 '서양음악(클래식)' 등).
 * 그때는 색을 억지로 배정하지 않고 원본 표기를 중립 배지로 보여줍니다 —
 * 틀린 장르 라벨을 붙이는 것보다 낫습니다.
 */
export function GenreTag({
  genre,
  label,
  size = 'md',
}: {
  genre: Genre | null
  /** genre 가 null 일 때 보여줄 원본 표기 */
  label?: string
  size?: 'sm' | 'md'
}) {
  const sm0 = size === 'sm'
  if (!genre) {
    if (!label) return null
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border border-border bg-surface-2 font-semibold text-ink-2',
          sm0 ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
        )}
      >
        {label}
      </span>
    )
  }
  const color = GENRE_COLOR[genre]
  const sm = size === 'sm'
  return (
    <span
      className={cn(
        'genre-tag inline-flex items-center gap-1 rounded-full border font-semibold',
        sm ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
      )}
      // 글자색은 테마에 따라 CSS가 고릅니다(.genre-tag) — 라이트는 어둡게, 다크는 원색.
      // 점은 어느 쪽이든 원색이라 장르 구분이 유지됩니다.
      style={
        {
          '--genre': color,
          '--genre-ink': darken(color, 0.45),
          borderColor: alpha(color, 0.35),
          background: alpha(color, 0.12),
        } as CSSProperties
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {genre}
    </span>
  )
}

export function Tag({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'ok' | 'warn' | 'danger'
}) {
  const tones: Record<string, string> = {
    default: 'border-border bg-surface-2 text-ink-2',
    ok: 'border-ok/35 bg-ok/10 text-ok',
    warn: 'border-warn/35 bg-warn/10 text-warn',
    danger: 'border-danger/35 bg-danger/10 text-danger',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function StatusDot({ label, tone }: { label: string; tone: 'live' | 'soon' | 'done' }) {
  const map = {
    live: { dot: 'bg-gold-400', text: 'text-gold-text' },
    soon: { dot: 'bg-ok', text: 'text-ok' },
    done: { dot: 'bg-text-dim', text: 'text-ink-3' },
  }[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-2xs font-semibold', map.text)}>
      <span className="relative flex h-1.5 w-1.5">
        {tone === 'live' && (
          <span className={cn('absolute inline-flex h-full w-full animate-pulse-ring rounded-full', map.dot)} />
        )}
        <span className={cn('relative h-1.5 w-1.5 rounded-full', map.dot)} />
      </span>
      {label}
    </span>
  )
}
