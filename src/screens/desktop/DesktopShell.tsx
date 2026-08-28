import { Bell, ExternalLink, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { ROLE_DESCRIPTION, ROLE_LABEL } from '@/config/nav'
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
  const role = useAppStore((s) => s.role)
  const setRole = useAppStore((s) => s.setRole)
  const unread = useAppStore((s) =>
    s.notifications.filter((n) => n.role === s.role && !n.read).length,
  )
  const isDesktop = useIsDesktop()

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
    <div className="flex h-screen w-full flex-col bg-bg text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('/landing')} aria-label="랜딩페이지로">
            <LogoMark className="w-[92px]" />
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-border bg-surface-2 p-1 md:flex">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-bold transition-colors',
                  role === r ? 'brand-gradient text-white' : 'text-ink-2',
                )}
                title={ROLE_DESCRIPTION[r]}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-2">
            <Bell size={18} />
            {unread > 0 && (
              <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF3D77] px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-bold text-ink-2"
          >
            <Smartphone size={14} />
            모바일 앱 보기
          </button>
          <button
            onClick={() => navigate('/landing')}
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-ink-3 sm:flex"
          >
            랜딩페이지
            <ExternalLink size={12} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
