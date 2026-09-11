import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'brand' | 'solid' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  full?: boolean
  leading?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  // ★ 이 앱에서 유일하게 "누르세요"라고 말하는 버튼이라, 은은한 금색 글로우로 항상
  //   시선이 먼저 가게 합니다. 호버 가능한 기기에서는 손을 올렸을 때 한 번 더 밝아집니다.
  brand:
    'bg-gold-500 text-gold-ink font-bold shadow-[0_8px_28px_rgb(var(--color-gold-500)/0.38)] ' +
    'hover:shadow-[0_10px_34px_rgb(var(--color-gold-500)/0.5)]',
  solid: 'bg-surface-2 text-ink font-semibold border border-border-strong',
  ghost: 'bg-transparent text-ink-2 font-semibold',
  outline: 'bg-transparent text-ink font-semibold border border-border-strong',
  danger: 'bg-danger/15 text-danger font-semibold border border-danger/35',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs rounded-xl',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-[52px] px-5 text-[15px] rounded-2xl',
}

export function Button({
  variant = 'solid',
  size = 'md',
  loading = false,
  full = false,
  leading,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-base ease-standard active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leading}
      {children}
    </button>
  )
}

export function IconButton({
  children,
  className,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      className={cn(
        'tap inline-flex items-center justify-center rounded-full border border-border bg-surface/80 text-ink-2 backdrop-blur',
        'transition-colors active:bg-surface-2',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500',
        className,
      )}
    >
      {children}
    </button>
  )
}
