import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'

/** ESC로 닫기 — 시트/모달 공용 */
function useEscClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  /** 하단에 고정되는 액션 영역 */
  footer?: ReactNode
  /** 시트 최대 높이 (뷰포트 대비 %) */
  maxHeightPct?: number
}

/** 모달형 바텀시트 — 스프링 애니메이션 + 아래로 끌어 닫기 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightPct = 88,
}: Props) {
  useEscClose(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button
            aria-label="닫기"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl border-x border-t border-border bg-surface"
            style={{ maxHeight: `${maxHeightPct}%` }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 700) onClose()
            }}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <div className="h-1 w-10 rounded-full bg-border-strong" />
            </div>
            {(title || subtitle) && (
              <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-1">
                <div className="min-w-0">
                  {title && <h2 className="text-[17px] font-bold leading-tight">{title}</h2>}
                  {subtitle && <p className="mt-1 text-xs leading-snug text-ink-2">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="닫기"
                  className="tap -mr-2 -mt-2 flex items-center justify-center rounded-full text-ink-3 active:text-ink"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>
            {footer && (
              <div className="shrink-0 border-t border-border bg-surface px-5 py-3.5">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** 가운데 뜨는 모달 (계약서 미리보기 등) */
export function CenterModal({
  open,
  onClose,
  title,
  children,
  footer,
}: Omit<Props, 'maxHeightPct' | 'subtitle'>) {
  useEscClose(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <div
          className="absolute inset-0 z-[85] flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            aria-label="닫기"
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative flex max-h-[76%] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface',
            )}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 42 }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-[16px] font-bold">{title}</h2>
              <button onClick={onClose} aria-label="닫기" className="tap text-ink-3 active:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="shrink-0 border-t border-border px-5 py-3.5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
