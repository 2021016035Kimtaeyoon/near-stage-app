import { Landmark, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { GENRE_COLOR, alpha } from '@/lib/theme'
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

export function GenreTag({ genre, size = 'md' }: { genre: Genre; size?: 'sm' | 'md' }) {
  const color = GENRE_COLOR[genre]
  const sm = size === 'sm'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        sm ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
      )}
      style={{ color, borderColor: alpha(color, 0.35), background: alpha(color, 0.12) }}
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
    live: { color: '#F0B429', text: 'text-[#F7C851]' },
    soon: { color: '#4ED4A0', text: 'text-ok' },
    done: { color: '#6B6B77', text: 'text-ink-3' },
  }[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-2xs font-semibold', map.text)}>
      <span className="relative flex h-1.5 w-1.5">
        {tone === 'live' && (
          <span
            className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full"
            style={{ background: map.color }}
          />
        )}
        <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: map.color }} />
      </span>
      {label}
    </span>
  )
}
