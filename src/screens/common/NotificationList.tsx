import {
  Bell,
  Calendar,
  CheckCheck,
  MessageSquareText,
  Megaphone,
  Star,
  ThumbsUp,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { relativeFromNow } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'
import type { AppNotification, NotificationType, Role } from '@/types'

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  지원: Megaphone,
  수락: ThumbsUp,
  거절: XCircle,
  예약: Calendar,
  확정: Bell,
  정산: Wallet,
  리뷰: Star,
  제안: MessageSquareText,
  시스템: Bell,
}

/** 역할별 알림 목록 — 마이 페이지의 알림 탭과 /notifications 라우트가 함께 사용합니다 */
export function NotificationList({ role, showHeader = true }: { role: Role; showHeader?: boolean }) {
  const navigate = useNavigate()
  const notifications = useAppStore((s) => s.notifications)
  const nowIso = useAppStore((s) => s.demoNowIso)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)

  const mine = notifications
    .filter((n) => n.role === role)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unread = mine.filter((n) => !n.read).length

  const open = (n: AppNotification) => {
    markNotificationRead(n.id)
    if (n.link) navigate(n.link)
  }

  if (mine.length === 0) {
    return <EmptyState art="chat" title="알림이 없어요" description="새 소식이 오면 여기에 모아서 보여드려요." />
  }

  return (
    <div>
      {showHeader && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-ink-3">
            안 읽은 알림 <span className="tnum font-bold text-ink">{unread}</span>건
          </p>
          {unread > 0 && (
            <button
              onClick={() => markAllNotificationsRead(role)}
              className="flex items-center gap-1 text-xs font-bold text-ink-2"
            >
              <CheckCheck size={13} />
              모두 읽음
            </button>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        {mine.map((n) => {
          const Icon = TYPE_ICON[n.type]
          return (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                n.read ? 'border-border bg-surface' : 'border-border-strong bg-surface-2',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  n.read ? 'bg-surface-2 text-ink-3' : 'brand-gradient text-white',
                )}
              >
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold">{n.title}</span>
                  {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3D5FC7]" />}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-2">{n.body}</span>
                <span className="tnum mt-1 block text-2xs text-ink-3">
                  {relativeFromNow(n.createdAt, nowIso)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
