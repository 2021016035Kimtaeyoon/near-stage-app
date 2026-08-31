import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToastStore, type ToastTone } from '@/store/useToast'

const ICONS: Record<ToastTone, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
}

const COLORS: Record<ToastTone, string> = {
  default: 'text-ink',
  success: 'text-ok',
  warn: 'text-warn',
  error: 'text-danger',
}

/** 앱 뷰포트(아이폰 프레임) 안에만 뜨도록 absolute 로 배치합니다 */
export function ToastHost() {
  const items = useToastStore((s) => s.items)
  const remove = useToastStore((s) => s.remove)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4 pt-14">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
              onClick={() => remove(t.id)}
              className="pointer-events-auto flex w-full max-w-[340px] items-start gap-2.5 rounded-2xl border border-border bg-surface-1/97 px-3.5 py-3 text-left backdrop-blur-md"
              style={{ boxShadow: '0 16px 40px rgba(23,23,28,.16)' }}
            >
              <Icon size={17} className={`mt-0.5 shrink-0 ${COLORS[t.tone]}`} />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-snug text-ink">
                  {t.text}
                </span>
                {t.detail && (
                  <span className="mt-0.5 block text-xs leading-snug text-ink-2">{t.detail}</span>
                )}
              </span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
