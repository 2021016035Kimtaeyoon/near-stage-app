import { Minus, Plus } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-xs font-semibold text-ink-2">{children}</span>
      {hint && <span className="text-2xs text-ink-3">{hint}</span>}
    </div>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none',
        'placeholder:text-ink-3 focus:border-border-strong',
        className,
      )}
    />
  )
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed outline-none',
        'placeholder:text-ink-3 focus:border-border-strong',
        className,
      )}
    />
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 12,
  unit = '',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  unit?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="빼기"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="tap flex items-center justify-center rounded-xl border border-border bg-surface text-ink-2 disabled:opacity-35"
      >
        <Minus size={16} />
      </button>
      <span className="tnum w-14 text-center text-sm font-bold">
        {value}
        {unit}
      </span>
      <button
        type="button"
        aria-label="더하기"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="tap flex items-center justify-center rounded-xl border border-border bg-surface text-ink-2 disabled:opacity-35"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  unit = '',
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="tnum text-lg font-bold">
          {value}
          <span className="ml-0.5 text-xs font-semibold text-ink-2">{unit}</span>
        </span>
        <span className="tnum text-2xs text-ink-3">
          {min}~{max}
          {unit}
        </span>
      </div>
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
        <div
          className="brand-gradient absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-9 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#5B84DE]
            [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#5B84DE]"
        />
      </div>
    </div>
  )
}

/** 완성도 % 게이지 */
export function Gauge({ value, caption }: { value: number; caption?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-2">입력 완성도</span>
        <span className="tnum text-sm font-bold">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="brand-gradient h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      {caption && <p className="mt-2 text-2xs leading-snug text-ink-3">{caption}</p>}
    </div>
  )
}
