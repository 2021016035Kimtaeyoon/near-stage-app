import type { ReactNode } from 'react'

/** 빈 상태 일러스트 — 외부 이미지 없이 직접 그린 SVG */
export type EmptyArt = 'stage' | 'search' | 'ticket' | 'chat' | 'chart'

function Art({ kind }: { kind: EmptyArt }) {
  const common = { fill: 'none', stroke: '#C7C7D1', strokeWidth: 1.6, strokeLinecap: 'round' as const }
  switch (kind) {
    case 'stage':
      return (
        <svg viewBox="0 0 120 88" className="h-[88px] w-[120px]">
          <ellipse cx="60" cy="72" rx="42" ry="8" {...common} />
          <path d="M28 72V44h64v28" {...common} />
          <path d="M22 44h76" {...common} />
          <path d="M38 44V26a22 22 0 0 1 44 0v18" {...common} strokeDasharray="4 5" />
          <circle cx="60" cy="34" r="7" stroke="#FF6B4A" strokeWidth="1.8" fill="none" />
          <path d="M60 41v10M53 51h14" stroke="#FF6B4A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 120 88" className="h-[88px] w-[120px]">
          <circle cx="54" cy="40" r="22" {...common} />
          <path d="M70 56l16 16" {...common} strokeWidth="2.2" />
          <path d="M44 40h20M54 30v20" stroke="#C7C7D1" strokeWidth="1.4" strokeDasharray="3 4" />
          <circle cx="54" cy="40" r="6" stroke="#FF6B4A" strokeWidth="1.8" fill="none" />
        </svg>
      )
    case 'ticket':
      return (
        <svg viewBox="0 0 120 88" className="h-[88px] w-[120px]">
          <path
            d="M26 28h68v14a6 6 0 0 0 0 12v14H26V54a6 6 0 0 0 0-12V28Z"
            {...common}
          />
          <path d="M60 30v6M60 42v6M60 54v6M60 66v-4" stroke="#C7C7D1" strokeWidth="1.4" strokeDasharray="3 4" />
          <path d="M36 44h14M36 52h10" stroke="#FF6B4A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 120 88" className="h-[88px] w-[120px]">
          <path d="M24 24h48v30H42l-12 10V54H24V24Z" {...common} />
          <path d="M60 40h36v26h-8l-8 8v-8H60" {...common} strokeDasharray="4 5" />
          <path d="M34 34h26M34 42h18" stroke="#FF6B4A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 120 88" className="h-[88px] w-[120px]">
          <path d="M24 68h72M24 68V20" {...common} />
          <rect x="36" y="50" width="10" height="18" {...common} />
          <rect x="54" y="40" width="10" height="28" {...common} />
          <rect x="72" y="30" width="10" height="38" stroke="#FF6B4A" strokeWidth="1.8" fill="none" />
        </svg>
      )
  }
}

export function EmptyState({
  art = 'search',
  title,
  description,
  action,
}: {
  art?: EmptyArt
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <Art kind={art} />
      <h3 className="mt-4 text-[15px] font-bold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-ink-3">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** 로딩 스켈레톤 카드 */
export function SkeletonCard() {
  return (
    <div className="card flex gap-3 p-3">
      <div className="skeleton h-[76px] w-[76px] shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
