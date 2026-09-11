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

/**
 * 금색 유광 글로우 — Button(variant="brand")과, Button 구조에 안 맞는 배너형
 * 버튼(대시보드 알림 배너 등)이 함께 씁니다. 한 군데서만 바꾸면 앱 전체의 "핵심
 * 액션" 색이 같이 바뀌도록, 클래스 문자열 자체를 export 합니다.
 *
 * ★ 이 앱에서 유일하게 "누르세요"라고 말하는 색이라, 은은한 금색 글로우와 위쪽
 *   유광 하이라이트로 눌러볼 만한 입체감을 줍니다. 손을 올리면 더 밝아지고
 *   누르는 순간엔(active) 눌린 것처럼 하이라이트가 안으로 들어갑니다 — Button 의
 *   active:scale-[0.98]과 함께 눌리는 촉감을 만듭니다(배너형은 직접 눌림 효과를
 *   추가해야 촉감까지 같아집니다).
 */
export const BRAND_GLOW =
  'bg-gradient-to-b from-gold-400 to-gold-500 text-gold-ink font-bold ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_8px_28px_rgb(var(--color-gold-500)/0.4),0_2px_10px_rgb(var(--color-gold-600)/0.3)] ' +
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_12px_36px_rgb(var(--color-gold-500)/0.55),0_2px_12px_rgb(var(--color-gold-600)/0.35)] ' +
  'active:shadow-[inset_0_2px_4px_rgba(0,0,0,.18),0_4px_14px_rgb(var(--color-gold-500)/0.35)]'

const VARIANTS: Record<Variant, string> = {
  brand: BRAND_GLOW,
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
