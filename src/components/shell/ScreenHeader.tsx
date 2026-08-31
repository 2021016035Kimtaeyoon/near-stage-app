import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface Props {
  title: string
  subtitle?: string
  /** 뒤로가기 버튼 노출 */
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  /** 투명 배경(히어로 위에 겹칠 때) */
  transparent?: boolean
  className?: string
}

/** 상단 안전영역(다이나믹 아일랜드) 확보용 패딩 포함 */
export function ScreenHeader({
  title,
  subtitle,
  back = false,
  onBack,
  right,
  transparent = false,
  className,
}: Props) {
  const navigate = useNavigate()
  return (
    <header
      className={cn(
        'relative z-40 flex shrink-0 items-center gap-2 px-4 pb-3 pt-12',
        transparent
          ? 'bg-transparent'
          : 'border-b border-border bg-surface-1/90 backdrop-blur-xl',
        className,
      )}
    >
      {back && (
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label="뒤로"
          className="tap -ml-2 flex items-center justify-center rounded-full text-ink active:bg-surface-2"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs text-ink-2">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
    </header>
  )
}

/** 스크롤되는 화면 본문 컨테이너 */
export function ScreenBody({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain',
        padded && 'px-4 pt-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** 화면 전체 래퍼 (헤더 + 본문 + 탭바 구조) */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex h-full flex-col bg-bg', className)}>{children}</div>
}

export function SectionTitle({
  children,
  right,
  className,
}: {
  children: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-2.5 flex items-baseline justify-between gap-2', className)}>
      <h2 className="text-[15px] font-bold">{children}</h2>
      {right}
    </div>
  )
}
