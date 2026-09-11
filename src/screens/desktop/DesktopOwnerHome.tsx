import { CalendarDays, ChevronRight, Music4, PenLine, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/ui/Badge'
import { BRAND_GLOW, Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiCard, KpiGrid } from '@/components/ui/Kpi'
import { useAuthStore } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { useMyVenues } from '@/hooks/useMyResources'
import { useMyPosts } from '@/hooks/usePosts'
import { useChatThreads } from '@/hooks/useChat'
import {
  soonShows,
  summarize,
  useVenueShows,
  useWeeklyStats,
  type VenueShow,
} from '@/hooks/useVenueStats'
import { humanDateTime, shiftWeek, weekStartKey } from '@/lib/datetime'
import { PerformanceChart } from '@/screens/owner/PerformanceChart'
import { PreShowChecklist } from '@/screens/owner/PreShowChecklist'
import { ShowReportSheet } from '@/screens/owner/ShowReportSheet'
import { WeeklyVisitors } from '@/screens/owner/WeeklyVisitors'
import { useNow } from '@/store/useAppStore'

/**
 * 데스크톱 홈 — 호스트용 (§14).
 *
 * 모바일 대시보드와 같은 데이터를 읽고 넓은 화면에 맞게 배치만 다릅니다.
 * ★ "예상 추가 집객" 같은 추정치는 두지 않습니다 — 공연이 없던 날의 방문객을
 *   알 방법이 없어서, 그 숫자로 결정을 내리게 되면 없는 것보다 나쁩니다.
 */
export function DesktopOwnerHome() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const venues = useMyVenues()
  const shows = useVenueShows(venues.data.map((v) => v.id))
  const chatThreads = useChatThreads()
  const threadIdFor = (venueId: string, artistId: string) =>
    chatThreads.data.find((t) => t.venueId === venueId && t.artistId === artistId)?.id
  const posts = useMyPosts(venues.data.filter((v) => v.status === 'approved').map((v) => v.id))
  // ★ 주에 한 번만 바뀌는 값이라 시계가 갈 때마다 다시 조회하지 않습니다
  const sinceWeek = shiftWeek(weekStartKey(nowIso), -26)
  const weekly = useWeeklyStats(
    venues.data.map((v) => v.id),
    sinceWeek,
  )
  const [reporting, setReporting] = useState<VenueShow | null>(null)

  if (!userId || (!venues.loading && venues.data.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          art="stage"
          title={userId ? '아직 등록한 공간이 없어요' : '로그인하면 성과를 볼 수 있어요'}
          description="가게를 등록하면 여기에서 공연 일정과 집객 효과를 봅니다."
          action={
            <Button variant="brand" onClick={() => navigate('/desktop/host/venue/new')}>
              우리 가게 등록하기
            </Button>
          }
        />
      </div>
    )
  }

  if (venues.loading || shows.loading) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    )
  }

  const sum = summarize(shows.data, nowIso)
  const now = new Date(nowIso).getTime()
  const upcoming = shows.data
    .filter((s) => new Date(s.startsAt).getTime() >= now && s.status !== 'canceled')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 6)
  const needReport = shows.data.filter(
    (s) =>
      s.visitorCount === null &&
      s.status !== 'canceled' &&
      new Date(s.startsAt).getTime() + s.durationMin * 60_000 < now,
  )
  const pendingApplicants = posts.data.reduce((n, p) => n + p.pendingCount, 0)
  const title = venues.data.length === 1 ? venues.data[0].name : `공간 ${venues.data.length}곳`

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold">{title}</h1>
            <p className="mt-1 text-sm text-ink-2">호스트 대시보드</p>
          </div>
          {pendingApplicants > 0 && (
            <button
              onClick={() => navigate('/desktop/owner/recruit')}
              className={cn(
                BRAND_GLOW,
                'flex shrink-0 items-center gap-1.5 rounded-full px-5 py-3 text-sm transition-all duration-base ease-standard active:scale-[0.98]',
              )}
            >
              기다리는 지원자 {pendingApplicants}팀 확인하기
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <KpiGrid className="md:grid-cols-3">
          <KpiCard icon={CalendarDays} label="이번 달 공연" value={`${sum.monthShows}건`} tone="brand" />
          <KpiCard
            icon={Users}
            label="이번 달 참석 예정"
            value={`${sum.monthGoing}명`}
            hint="앱에서 누른 수"
          />
          <KpiCard
            icon={Music4}
            label="실제 방문"
            value={sum.reportedShows > 0 ? `${sum.reportedVisitors}명` : '기록 전'}
            hint={sum.reportedShows > 0 ? `공연 ${sum.reportedShows}건 기준` : '공연 후 직접 기록'}
          />
        </KpiGrid>

        {soonShows(shows.data, nowIso).length > 0 && (
          <div className="card mt-6 p-5">
            <h2 className="mb-3 text-[15px] font-bold">공연 전 확인</h2>
            <PreShowChecklist
              shows={shows.data}
              venues={venues.data}
              threadIdFor={threadIdFor}
              nowIso={nowIso}
            />
          </div>
        )}

        {needReport.length > 0 && (
          <div className="card mt-6 p-5">
            <h2 className="mb-1 text-[15px] font-bold">끝난 공연 · 방문객 기록</h2>
            <p className="mb-3 text-2xs text-ink-3">
              실제로 몇 분이 오셨는지 적어주셔야 성과가 쌓입니다. 대략이어도 괜찮아요.
            </p>
            <div className="space-y-2">
              {needReport.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.title}</p>
                    <p className="tnum text-2xs text-ink-3">
                      {humanDateTime(s.startsAt, nowIso)} · 참석 예정 {s.goingCount}명
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="brand"
                    leading={<PenLine size={13} />}
                    onClick={() => setReporting(s)}
                  >
                    기록
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {venues.data.map((v) => (
            <WeeklyVisitors
              key={v.id}
              venueId={v.id}
              venueName={venues.data.length > 1 ? v.name : undefined}
              rows={weekly.data}
              nowIso={nowIso}
              onSaved={weekly.refresh}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <PerformanceChart shows={shows.data} />

          <div className="card p-5">
            <h2 className="mb-4 text-[15px] font-bold">다가오는 공연</h2>
            {upcoming.length === 0 ? (
              <EmptyState art="stage" title="예정된 공연이 없어요" />
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/desktop/audience/show/${s.id}`)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    {s.artistPhotos[0] ? (
                      <img
                        src={s.artistPhotos[0]}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3">
                        <Music4 size={15} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{s.title}</p>
                      <p className="tnum text-xs text-ink-2">{humanDateTime(s.startsAt, nowIso)}</p>
                    </div>
                    <Tag tone="ok">{s.goingCount}명</Tag>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ShowReportSheet
        show={reporting}
        open={reporting !== null}
        onClose={() => setReporting(null)}
        onDone={shows.refresh}
      />
    </div>
  )
}
