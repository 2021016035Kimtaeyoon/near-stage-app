import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChipProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  /** 브랜드 강조 (우리 무대만 보기 토글 등) */
  brand?: boolean
  className?: string
}

export function Chip({ active = false, onClick, children, brand = false, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors',
        active
          ? brand
            ? 'bg-gold-500 border-transparent text-gold-ink'
            : 'border-ink/80 bg-ink text-bg'
          : 'border-border bg-surface text-ink-2 active:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
  className?: string
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-1 rounded-xl border border-border bg-surface-2 p-1', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            // 선택 칩은 배경색 차이(라이트에서 7유닛뿐)가 아니라 "떠오른 알약"으로 구분합니다
            'h-9 flex-1 rounded-lg text-xs font-semibold transition-all duration-base ease-standard',
            value === o.value
              ? 'bg-bg text-ink shadow-[var(--shadow-card)]'
              : 'text-ink-3 active:text-ink-2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="tap flex w-full items-center justify-between gap-3 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-3">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors duration-200',
          // OFF일 때 흰 노브 on border-strong은 라이트에서 대비 1.2:1이라 빈 알약처럼 보였습니다
          checked ? 'bg-gold-500' : 'bg-surface-3 ring-1 ring-inset ring-border-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-6 w-6 rounded-full bg-bg shadow-[0_1px_3px_rgba(17,17,26,.25)] transition-all duration-200',
            checked ? 'left-[25px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  )
}
