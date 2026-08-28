import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'brand'
}

/** 대시보드 KPI 카드 — 숫자는 tabular-nums, 확실히 크게 */
export function KpiCard({ icon: Icon, label, value, hint, tone = 'default' }: KpiCardProps) {
  return (
    <div className="card p-3.5">
      <div
        className={cn(
          'mb-2 flex h-8 w-8 items-center justify-center rounded-lg',
          tone === 'brand' ? 'brand-gradient text-white' : 'bg-surface-2 text-ink-2',
        )}
      >
        <Icon size={15} />
      </div>
      <p className="text-2xs font-semibold text-ink-3">{label}</p>
      <p className="tnum mt-0.5 text-xl font-extrabold leading-tight">{value}</p>
      {hint && <p className="mt-1 text-2xs text-ink-3">{hint}</p>}
    </div>
  )
}

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-2.5', className)}>{children}</div>
}
