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
            ? 'brand-gradient border-transparent text-white'
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
      className={cn('flex gap-1 rounded-xl border border-border bg-surface p-1', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-9 flex-1 rounded-lg text-xs font-semibold transition-colors',
            value === o.value ? 'bg-surface-2 text-ink' : 'text-ink-3 active:text-ink-2',
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
          checked ? 'brand-gradient' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-6 w-6 rounded-full bg-white transition-all duration-200',
            checked ? 'left-[25px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  )
}
