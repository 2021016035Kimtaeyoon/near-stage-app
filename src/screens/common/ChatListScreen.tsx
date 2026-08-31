import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SeedAvatar } from '@/components/ui/PosterArt'
import { relativeFromNow } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'

export function ChatListScreen() {
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const venueId = useAppStore((s) => s.currentVenueId)
  const performerId = useAppStore((s) => s.currentPerformerId)
  const threads = useAppStore((s) => s.chatThreads)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const nowIso = useAppStore((s) => s.demoNowIso)

  const mine = threads
    .filter((t) => (role === 'owner' ? t.venueId === venueId : t.performerId === performerId))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())

  return (
    <Screen>
      <ScreenHeader title="채팅" />
      <ScreenBody>
        {mine.length === 0 ? (
          <EmptyState art="chat" title="대화가 없어요" description="공간이나 아티스트에게 먼저 말을 걸어보세요." />
        ) : (
          <div className="space-y-1">
            {mine.map((t) => {
              const venue = venues.find((v) => v.id === t.venueId)
              const performer = performers.find((p) => p.id === t.performerId)
              if (!venue || !performer) return null
              const name = role === 'owner' ? performer.teamName : venue.name
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/chat/${t.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-surface-2"
                >
                  <SeedAvatar seed={performer.photoSeed} genre={performer.genre} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold">{name}</p>
                      <span className="tnum shrink-0 text-2xs text-ink-3">
                        {relativeFromNow(t.lastAt, nowIso)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-ink-2">{t.lastText}</p>
                  </div>
                  {t.unread > 0 && (
                    <span className="bg-gold-500 tnum flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold text-gold-ink">
                      {t.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
