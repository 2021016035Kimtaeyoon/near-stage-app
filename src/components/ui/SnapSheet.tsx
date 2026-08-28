import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type SnapIndex = 0 | 1 | 2

interface Props {
  /** 0=접힘, 1=중간, 2=펼침 */
  snap: SnapIndex
  onSnapChange: (s: SnapIndex) => void
  /** 각 스냅 단계의 높이(px) */
  heights?: [number, number, number]
  header?: ReactNode
  children: ReactNode
  className?: string
}

const DEFAULT_HEIGHTS: [number, number, number] = [128, 380, 720]

/**
 * 지도 위에 얹히는 3단 스냅 바텀시트.
 * 핸들을 위/아래로 끌면 단계가 바뀌고, 스프링으로 붙습니다.
 */
export function SnapSheet({
  snap,
  onSnapChange,
  heights = DEFAULT_HEIGHTS,
  header,
  children,
  className,
}: Props) {
  const height = heights[snap]

  const handleDragEnd = (offsetY: number, velocityY: number) => {
    const up = offsetY < -44 || velocityY < -520
    const down = offsetY > 44 || velocityY > 520
    if (up && snap < 2) onSnapChange((snap + 1) as SnapIndex)
    else if (down && snap > 0) onSnapChange((snap - 1) as SnapIndex)
  }

  return (
    <motion.section
      aria-label="공연 목록"
      className={cn(
        'absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-x border-t border-border bg-surface/95 backdrop-blur-xl',
        className,
      )}
      style={{ boxShadow: '0 -18px 48px rgba(0,0,0,.5)' }}
      animate={{ height }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
    >
      <motion.div
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.16}
        onDragEnd={(_, info) => handleDragEnd(info.offset.y, info.velocity.y)}
      >
        <button
          type="button"
          aria-label="목록 펼치기"
          onClick={() => onSnapChange((snap === 2 ? 0 : snap + 1) as SnapIndex)}
          className="flex w-full justify-center py-2.5"
        >
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </button>
        {header && <div className="px-4 pb-2">{header}</div>}
      </motion.div>

      <div
        className={cn(
          'min-h-0 flex-1 overscroll-contain px-4 pb-24',
          snap === 0 ? 'overflow-hidden' : 'overflow-y-auto',
        )}
      >
        {children}
      </div>
    </motion.section>
  )
}
