import { motion } from 'framer-motion'
import { Bell, ExternalLink, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { ROLE_DESCRIPTION, ROLE_LABEL, TABS } from '@/config/nav'
import { cn } from '@/lib/cn'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useAppStore } from '@/store/useAppStore'
import type { Role } from '@/types'

const ROLES: Role[] = ['audience', 'owner', 'performer']

/**
 * 데스크톱 웹앱 공통 셸 — 상단 내비게이션 + 역할 전환.
 * 모바일 프로토타입(`/`)과 같은 zustand 스토어를 그대로 공유하므로
 * 여기서 역할을 바꾸면 모바일 쪽에서도 동일하게 반영됩니다.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAppStore((s) => s.role)
  const setRole = useAppStore((s) => s.setRole)
  const unread = useAppStore((s) =>
    s.notifications.filter((n) => n.role === s.role && !n.read).length,
  )
  const isDesktop = useIsDesktop()
  const subPath = location.pathname.replace(/^\/desktop/, '') || '/'

  // 이 화면은 넓은 화면 전용 레이아웃(고정 폭 사이드바 등)이라 좁은 화면에서는
  // 레이아웃이 깨집니다. 모바일 폭에서는 잘 만들어진 모바일 앱으로 안내합니다.
  if (!isDesktop) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
        <LogoMark className="w-[120px]" />
        <p className="text-sm leading-relaxed text-ink-2">
          이 화면은 데스크톱 큰 화면에 최적화되어 있어요.
          <br />
          지금 보고 계신 화면 크기에는 모바일 앱이 더 잘 맞아요.
        </p>
        <button
          onClick={() => navigate('/')}
          className="brand-gradient mt-2 flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold text-white"
        >
          <Smartphone size={15} />
          모바일 앱으로 보기
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col bg-surface-2/40 text-ink">
      <header
        className="relative z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-border bg-bg px-8"
        style={{ boxShadow: '0 1px 0 rgba(23,23,28,.04), 0 4px 16px -8px rgba(23,23,28,.06)' }}
      >
        <div className="flex items-center gap-9">
          <button onClick={() => navigate('/landing')} aria-label="랜딩페이지로" className="shrink-0">
            <LogoMark className="w-[88px]" />
          </button>

          <div className="hidden items-center gap-0.5 rounded-full border border-border bg-surface-2 p-1 md:flex">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r)
                  navigate('/desktop')
                }}
                className={cn(
                  'relative rounded-full px-4 py-1.5 text-sm font-bold transition-colors',
                  role === r ? 'text-white' : 'text-ink-2 hover:text-ink',
                )}
                title={ROLE_DESCRIPTION[r]}
              >
                {role === r && (
                  <motion.span
                    layoutId="desktop-role-pill"
                    className="brand-gradient absolute inset-0 rounded-full"
                    style={{ boxShadow: '0 4px 12px -2px rgba(61,95,199,.4)' }}
                    transition={{ type: 'spring', stiffness: 450, damping: 45 }}
                  />
                )}
                <span className="relative">{ROLE_LABEL[r]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/desktop/notifications')}
            aria-label="알림"
            className="tap relative flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="tnum absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3D5FC7] px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-bold text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
          >
            <Smartphone size={14} />
            모바일 앱 보기
          </button>
          <button
            onClick={() => navigate('/landing')}
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-ink-3 transition-colors hover:text-ink-2 sm:flex"
          >
            랜딩페이지
            <ExternalLink size={12} />
          </button>
        </div>
      </header>

      <nav className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-bg px-8">
        {TABS[role].map((tab) => {
          const active = tab.matches.some((m) => subPath.startsWith(m))
          return (
            <button
              key={tab.to}
              onClick={() => navigate(`/desktop${tab.to}`)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-bold transition-colors',
                active
                  ? 'border-[#3D5FC7] text-ink'
                  : 'border-transparent text-ink-3 hover:text-ink-2',
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
