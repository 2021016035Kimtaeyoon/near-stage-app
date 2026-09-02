import { useLocation, useNavigate } from 'react-router-dom'
import { TABS } from '@/config/nav'
import { cn } from '@/lib/cn'
import { unreadNotificationCount } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

export function TabBar() {
  const role = useAppStore((s) => s.role)
  const notifications = useAppStore((s) => s.notifications)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const unread = unreadNotificationCount(notifications, role, followedPerformerIds)
  const tabs = TABS[role]

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-50 border-t border-border bg-surface-1/92 backdrop-blur-xl"
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 14px)' }}
      aria-label="주요 메뉴"
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const active = tab.matches.some((m) => pathname.startsWith(m))
          const Icon = tab.icon
          const badge = tab.to === '/notifications' ? unread : 0
          return (
            <li key={tab.to} className="flex-1">
              <button
                onClick={() => navigate(tab.to)}
                aria-current={active ? 'page' : undefined}
                className="tap flex w-full flex-col items-center gap-1 pt-2.5"
              >
                <span className="relative">
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 1.9}
                    className={active ? 'text-ink' : 'text-ink-3'}
                  />
                  {badge > 0 && (
                    <span className="bg-gold-500 tnum absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-gold-ink">
                      {badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    active ? 'text-ink' : 'text-ink-3',
                  )}
                >
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** 탭바 높이만큼 아래 여백 (스크롤 영역 하단에 넣어 사용) */
export function TabBarSpacer() {
  return <div className="h-[76px]" aria-hidden />
}
