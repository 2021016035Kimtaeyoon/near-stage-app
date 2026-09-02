import { AnimatePresence, motion } from 'framer-motion'
import { Repeat2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLE_DESCRIPTION, ROLE_HOME, ROLE_LABEL } from '@/config/nav'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Role } from '@/types'

const ROLES: Role[] = ['audience', 'owner', 'performer']

function useSwitchRole() {
  const role = useAppStore((s) => s.role)
  const setRole = useAppStore((s) => s.setRole)
  const navigate = useNavigate()
  return (next: Role) => {
    if (next === role) return
    setRole(next)
    navigate(ROLE_HOME[next])
    toast(`${ROLE_LABEL[next]} 화면으로 전환했습니다`, 'default', '데이터 상태는 그대로 유지됩니다')
  }
}

/** 모바일/프레임 안: 우하단 플로팅 버튼 */
export function RoleSwitcherFab() {
  const role = useAppStore((s) => s.role)
  const demoActive = useAppStore((s) => s.demo.active)
  const [open, setOpen] = useState(false)
  const switchRole = useSwitchRole()

  if (demoActive) return null

  return (
    <div className="absolute bottom-[92px] right-4 z-[70] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open &&
          ROLES.map((r, i) => (
            <motion.button
              key={r}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ delay: i * 0.035, type: 'spring', stiffness: 420, damping: 42 }}
              onClick={() => {
                switchRole(r)
                setOpen(false)
              }}
              className={cn(
                'flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold backdrop-blur-md',
                r === role
                  ? 'bg-gold-500 border-transparent text-gold-ink'
                  : 'border-border bg-surface/95 text-ink',
              )}
            >
              {ROLE_LABEL[r]}
              {r === role && <span className="text-2xs font-semibold opacity-80">현재</span>}
            </motion.button>
          ))}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="역할 전환"
        aria-expanded={open}
        className="bg-gold-500 flex h-14 w-14 items-center justify-center rounded-full text-gold-ink"
        style={{ boxShadow: '0 10px 30px rgba(255,196,46,.35)' }}
      >
        {open ? <X size={22} /> : <Repeat2 size={22} />}
      </button>
    </div>
  )
}

/** 데스크톱: 아이폰 프레임 옆 패널 */
export function RoleSwitcherPanel() {
  const role = useAppStore((s) => s.role)
  const switchRole = useSwitchRole()

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Repeat2 size={16} className="text-ink-2" />
        <span className="text-xs font-bold text-ink-2">역할 전환</span>
      </div>
      <div className="space-y-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => switchRole(r)}
            className={cn(
              'w-full rounded-xl border px-3.5 py-3 text-left transition-colors',
              r === role
                ? 'border-transparent bg-gradient-to-br from-[#FFC42E] to-[#FFC42E] text-white'
                : 'border-border bg-surface-2 text-ink hover:border-border-strong',
            )}
          >
            <div className="text-sm font-bold">{ROLE_LABEL[r]}</div>
            <div
              className={cn(
                'mt-0.5 text-[11px] leading-snug',
                r === role ? 'text-white/85' : 'text-ink-3',
              )}
            >
              {ROLE_DESCRIPTION[r]}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
        같은 데이터를 세 개의 눈으로 봅니다. 전환해도 상태는 유지됩니다.
      </p>
    </div>
  )
}
