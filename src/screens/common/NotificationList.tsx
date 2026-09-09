import {
  Bell,
  BellPlus,
  CalendarClock,
  CalendarX,
  CheckCheck,
  CircleCheck,
  Mail,
  Megaphone,
  Star,
  Ticket,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { markRead, useNotifications, type AppNotice } from '@/hooks/useNotifications'
import { relativeFromNow } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'

/**
 * 인앱 알림 목록 (§12).
 *
 * ★ 알림은 전부 서버가 만듭니다. 프론트에는 INSERT 권한이 없습니다.
 *   여기서는 읽고, 읽음 표시하고, 링크로 보내는 일만 합니다.
 *
 * 링크는 DB 에 문자열로 들어 있습니다. 없는 경로를 넣으면 눌러도 아무 데도 못 가서,
 * 0011 에서 죽은 링크 두 개를 실제 경로로 고쳤습니다.
 */

// ★ 서버가 넣는 type 과 여기 키가 어긋나면 조용히 기본 종 아이콘이 됩니다.
//   알림을 새로 만들 때는 반드시 여기에도 추가하세요.
const ICONS: Record<string, typeof Bell> = {
  accepted: CircleCheck,
  confirmed: Ticket,
  new_show: Megaphone,
  review: Star,
  review_request: Star,
  show_reminder: CalendarClock,
  show_canceled: CalendarX,
  saved_search: BellPlus,
  invited: Mail,
}

export function NotificationList({ showHeader = true }: { showHeader?: boolean }) {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const { data, loading, error, refresh, unread } = useNotifications()

  if (!userId) {
    return (
      <EmptyState
        art="chat"
        title="로그인하면 알림을 볼 수 있어요"
        description="공연 확정, 지원 결과 같은 소식이 여기로 옵니다."
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        art="search"
        title="불러오지 못했어요"
        description={error}
        action={
          <Button variant="outline" onClick={refresh}>
            다시 시도
          </Button>
        }
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        art="chat"
        title="아직 알림이 없어요"
        description="공연이 확정되거나 지원 결과가 나오면 여기로 옵니다."
      />
    )
  }

  const open = async (n: AppNotice) => {
    if (!n.readAt) {
      await markRead([n.id])
      refresh()
    }
    if (n.link) navigate(n.link)
  }

  const readAll = async () => {
    const ids = data.filter((n) => !n.readAt).map((n) => n.id)
    const err = await markRead(ids)
    if (!err) refresh()
  }

  return (
    <div>
      {showHeader && unread > 0 && (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="tnum text-2xs font-bold text-ink-2">읽지 않은 알림 {unread}건</p>
          <Button size="sm" variant="ghost" leading={<CheckCheck size={13} />} onClick={() => void readAll()}>
            모두 읽음
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {data.map((n) => {
          const Icon = ICONS[n.type] ?? Bell
          return (
            <button
              key={n.id}
              onClick={() => void open(n)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                n.readAt ? 'border-border bg-surface' : 'border-gold-500/40 bg-gold-500/8'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  n.readAt ? 'bg-surface-2 text-ink-3' : 'bg-gold-500 text-gold-ink'
                }`}
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold">{n.title}</span>
                  {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />}
                </span>
                {n.body && (
                  <span className="mt-0.5 block text-2xs leading-relaxed text-ink-2">{n.body}</span>
                )}
                <span className="tnum mt-0.5 block text-2xs text-ink-3">
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
