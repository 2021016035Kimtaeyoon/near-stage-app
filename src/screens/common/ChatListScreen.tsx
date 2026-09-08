import { MapPin, Music4 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useChatThreads, type ChatThread } from '@/hooks/useChat'
import { useMyVenues } from '@/hooks/useMyResources'
import { relativeFromNow } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'

/**
 * 대화방 목록 (§13).
 *
 * 대화방은 수락하는 순간 자동으로 생깁니다. 여기서 새로 만들 수는 없습니다 —
 * 아직 아무 관계도 없는 사람끼리 말을 걸 수 있게 하면 그때부터 스팸이 옵니다.
 */
export function ChatListScreen() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const { data, loading, error, refresh } = useChatThreads()
  const venues = useMyVenues()

  // 내가 공간 주인이면 상대는 팀, 팀 주인이면 상대는 공간입니다
  const myVenueIds = new Set(venues.data.map((v) => v.id))

  if (!userId) {
    return (
      <Screen>
        <ScreenHeader title="채팅" />
        <ScreenBody>
          <EmptyState
            art="chat"
            title="로그인하면 대화를 볼 수 있어요"
            description="공연이 확정되면 호스트와 팀 사이에 대화방이 열립니다."
          />
        </ScreenBody>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="채팅" />
      <ScreenBody>
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : error ? (
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
        ) : data.length === 0 ? (
          <EmptyState
            art="chat"
            title="아직 대화가 없어요"
            description="공연이 확정되면 호스트와 팀 사이에 대화방이 자동으로 열립니다. 여기서 시간·장비·개런티를 맞추세요."
          />
        ) : (
          <div className="space-y-1">
            {data.map((t) => (
              <ThreadRow
                key={t.id}
                thread={t}
                iAmHost={myVenueIds.has(t.venueId)}
                nowIso={nowIso}
                onOpen={() => navigate(`/chat/${t.id}`)}
              />
            ))}
          </div>
        )}
        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function ThreadRow({
  thread,
  iAmHost,
  nowIso,
  onOpen,
}: {
  thread: ChatThread
  iAmHost: boolean
  nowIso: string
  onOpen: () => void
}) {
  const name = iAmHost ? thread.artistName : thread.venueName
  const sub = iAmHost ? thread.venueName : thread.artistName
  const photo = (iAmHost ? thread.artistPhotos : thread.venuePhotos)[0]
  const Icon = iAmHost ? Music4 : MapPin

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-surface-2"
    >
      {photo ? (
        <img src={photo} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3">
          <Icon size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span className="mt-0.5 block truncate text-2xs text-ink-3">
          {sub} · {thread.showId ? '공연 확정' : '대화'}
        </span>
      </span>
      <span className="tnum shrink-0 text-2xs text-ink-3">
        {relativeFromNow(thread.createdAt, nowIso)}
      </span>
    </button>
  )
}
