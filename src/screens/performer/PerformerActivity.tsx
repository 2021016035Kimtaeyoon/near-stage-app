import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { SourceBadge, Tag } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PosterArt, Rating } from '@/components/ui/PosterArt'
import { Segmented } from '@/components/ui/Chip'
import { humanDateTime, relativeFromNow, won } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { FollowerTrendChart } from './FollowerTrendChart'
import { ShowWeekStrip } from './ShowWeekStrip'

type Tab = 'schedule' | 'settlement' | 'review'

export function PerformerActivity() {
  const [tab, setTab] = useState<Tab>('schedule')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const performerId = useAppStore((s) => s.currentPerformerId)
  const performer = useAppStore((s) => s.performers.find((p) => p.id === performerId))
  const shows = useAppStore((s) => s.shows.filter((sh) => sh.performerId === performerId))
  const venues = useAppStore((s) => s.venues)
  const posts = useAppStore((s) => s.posts)
  const settlements = useAppStore((s) => s.settlements)
  const reviews = useAppStore((s) => s.reviews.filter((r) => r.targetType === 'performer' && r.targetId === performerId))
  const nowIso = useAppStore((s) => s.demoNowIso)

  if (!performer) {
    return (
      <Screen>
        <ScreenHeader title="내 활동" />
        <EmptyState art="stage" title="프로필을 찾을 수 없어요" />
      </Screen>
    )
  }

  const myShowIds = new Set(shows.map((s) => s.id))
  const mySettlements = settlements.filter((st) => myShowIds.has(st.showId))
  const pendingApplications = posts.flatMap((p) =>
    p.applications
      .filter((a) => a.performerId === performerId && a.status === '대기')
      .map((a) => ({ application: a, post: p })),
  )
  const shownShows = shows
    .filter((s) => !selectedDate || s.startAt.slice(0, 10) === selectedDate)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())

  return (
    <Screen>
      <ScreenHeader title="내 활동" subtitle={performer.teamName} />
      <ScreenBody>
        <FollowerTrendChart performerId={performer.id} current={performer.followerCount} />

        <div className="mt-4">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'schedule', label: '공연 일정' },
              { value: 'settlement', label: '정산' },
              { value: 'review', label: '리뷰' },
            ]}
          />
        </div>

        <div className="mt-4">
          {tab === 'schedule' && (
            <div>
              {pendingApplications.length > 0 && (
                <div className="mb-3 space-y-2">
                  {pendingApplications.map(({ application, post }) => {
                    const venue = venues.find((v) => v.id === post.venueId)
                    return (
                      <div
                        key={application.id}
                        className="flex items-center justify-between rounded-xl border border-border-strong bg-surface-2 px-3.5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{venue?.name ?? '공간'} 지원 중</p>
                          <p className="tnum mt-0.5 text-2xs text-ink-3">
                            {relativeFromNow(application.createdAt, nowIso)} · 답변 대기
                          </p>
                        </div>
                        <Tag tone="warn">대기</Tag>
                      </div>
                    )
                  })}
                </div>
              )}
              <ShowWeekStrip nowIso={nowIso} shows={shows} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              <div className="mt-3 space-y-2.5">
                {shownShows.length === 0 ? (
                  <EmptyState art="stage" title="확정된 공연이 없어요" description="구인글에 지원하거나 역경매를 등록해보세요." />
                ) : (
                  shownShows.map((show) => {
                    const place = resolvePlace(show, venues)
                    return (
                      <div key={show.id} className="card flex gap-3 p-3">
                        <PosterArt seed={show.id + performer.photoSeed} genre={show.genre} className="h-14 w-14 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <SourceBadge source={show.source} size="sm" />
                            <Tag>{show.status}</Tag>
                          </div>
                          <p className="mt-1 truncate text-sm font-bold">{show.title}</p>
                          <p className="tnum mt-0.5 truncate text-xs text-ink-2">
                            {place?.name} · {humanDateTime(show.startAt, nowIso)}
                          </p>
                          <p className="tnum mt-0.5 text-2xs text-ink-3">
                            예약 {show.reservedCount}/{show.capacity}명
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {tab === 'settlement' &&
            (mySettlements.length === 0 ? (
              <EmptyState art="chart" title="정산 내역이 없어요" />
            ) : (
              <div className="space-y-2.5">
                {mySettlements.map((st) => {
                  const show = shows.find((s) => s.id === st.showId)
                  return (
                    <div key={st.id} className="card p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-bold">{show?.title ?? '공연'}</p>
                        <Tag tone={st.status === '정산완료' ? 'ok' : 'warn'}>{st.status}</Tag>
                      </div>
                      <div className="tnum mt-2 space-y-1 text-xs">
                        <Row label="총 매출" value={`${won(st.gross)}원`} />
                        <Row label="플랫폼 수수료" value={`-${won(st.platformFee)}원`} />
                        <Row label="정산액" value={`${won(st.net)}원`} bold />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

          {tab === 'review' &&
            (reviews.length === 0 ? (
              <EmptyState art="chat" title="아직 받은 리뷰가 없어요" />
            ) : (
              <div className="space-y-2.5">
                {reviews.map((r) => (
                  <div key={r.id} className="card p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{r.authorName}</span>
                      <Rating value={r.rating} size={12} />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r.text}</p>
                    <p className="tnum mt-1 text-2xs text-ink-3">{relativeFromNow(r.createdAt, nowIso)}</p>
                  </div>
                ))}
              </div>
            ))}
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-2">{label}</span>
      <span className={bold ? 'font-extrabold' : 'font-semibold'}>{value}</span>
    </div>
  )
}
