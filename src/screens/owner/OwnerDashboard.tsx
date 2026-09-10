import { CalendarDays, ChevronRight, Music4, PenLine, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader, SectionTitle } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FreeTrialNotice } from '@/components/ui/FreeTrialNotice'
import { KpiCard, KpiGrid } from '@/components/ui/Kpi'
import { useAuthStore } from '@/hooks/useAuth'
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
import { useNow } from '@/store/useAppStore'
import { PerformanceChart } from './PerformanceChart'
import { PreShowChecklist } from './PreShowChecklist'
import { ShowReportSheet } from './ShowReportSheet'
import { WeeklyVisitors } from './WeeklyVisitors'

/**
 * 호스트 대시보드 (§14).
 *
 * ★ 추정치를 만들지 않습니다. 예전에는 "예상 추가 집객 +N명"을 보여줬는데, 공연이
 *   없던 날의 방문객 수를 우리가 알 방법이 없습니다. 알 수 없는 값으로 만든 숫자를
 *   근거로 사장님이 결정을 내리게 되니, 없는 것보다 나쁩니다.
 *
 * 실제로 아는 것만 보여줍니다 — 공연 몇 건, 참석 예정 몇 명, 실제로 몇 명 오셨는지.
 * 마지막 값은 사장님이 직접 적어주셔야 생깁니다.
 */
export function OwnerDashboard() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const venues = useMyVenues()
  const venueIds = venues.data.map((v) => v.id)
  const shows = useVenueShows(venueIds)
  const posts = useMyPosts(venues.data.filter((v) => v.status === 'approved').map((v) => v.id))
  const chatThreads = useChatThreads()
  const threadIdFor = (venueId: string, artistId: string) =>
    chatThreads.data.find((t) => t.venueId === venueId && t.artistId === artistId)?.id
  // ★ 26주 전 월요일. nowIso 는 자주 바뀌지만 이 값은 주에 한 번만 바뀌어서
  //   시계가 갈 때마다 다시 조회하지 않습니다.
  const sinceWeek = shiftWeek(weekStartKey(nowIso), -26)
  const weekly = useWeeklyStats(venueIds, sinceWeek)

  const [reporting, setReporting] = useState<VenueShow | null>(null)

  if (!userId) {
    return (
      <Screen>
        <ScreenHeader title="대시보드" />
        <ScreenBody>
          <EmptyState
            art="stage"
            title="로그인하면 성과를 볼 수 있어요"
            description="가게를 등록하면 공연이 손님을 얼마나 데려왔는지 여기서 봅니다."
          />
        </ScreenBody>
      </Screen>
    )
  }

  if (venues.loading || shows.loading) {
    return (
      <Screen>
        <ScreenHeader title="대시보드" />
        <ScreenBody>
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        </ScreenBody>
      </Screen>
    )
  }

  if (venues.data.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="대시보드" />
        <ScreenBody>
          <EmptyState
            art="stage"
            title="아직 등록한 공간이 없어요"
            description="가게를 등록하면 여기에서 공연 일정과 집객 효과를 봅니다."
            action={
              <Button variant="brand" onClick={() => navigate('/host/venue/new')}>
                우리 가게 등록하기
              </Button>
            }
          />
        </ScreenBody>
      </Screen>
    )
  }

  const sum = summarize(shows.data, nowIso)
  const now = new Date(nowIso).getTime()
  const upcoming = shows.data
    .filter((s) => new Date(s.startsAt).getTime() >= now && s.status !== 'canceled')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 4)
  const needReport = shows.data.filter(
    (s) =>
      s.visitorCount === null &&
      s.status !== 'canceled' &&
      new Date(s.startsAt).getTime() + s.durationMin * 60_000 < now,
  )
  const pendingApplicants = posts.data.reduce((n, p) => n + p.pendingCount, 0)
  const title = venues.data.length === 1 ? venues.data[0].name : `공간 ${venues.data.length}곳`

  return (
    <Screen>
      <ScreenHeader title={title} subtitle="호스트 대시보드" />
      <ScreenBody>
        <FreeTrialNotice className="mb-4" />

        {pendingApplicants > 0 && (
          <button
            onClick={() => navigate('/owner/recruit')}
            className="bg-gold-500 mb-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-gold-ink"
          >
            <span>
              <span className="block text-[13px] font-extrabold">
                기다리는 지원자 {pendingApplicants}팀
              </span>
              <span className="mt-0.5 block text-2xs text-gold-ink/75">
                오래 기다리면 다른 무대로 갑니다
              </span>
            </span>
            <ChevronRight size={20} />
          </button>
        )}

        <SectionTitle>이번 달</SectionTitle>
        <KpiGrid>
          <KpiCard
            icon={CalendarDays}
            label="공연"
            value={`${sum.monthShows}건`}
            tone="brand"
          />
          <KpiCard icon={Users} label="참석 예정" value={`${sum.monthGoing}명`} hint="앱에서 누른 수" />
          <KpiCard
            icon={Music4}
            label="실제 방문"
            value={sum.reportedShows > 0 ? `${sum.reportedVisitors}명` : '기록 전'}
            hint={sum.reportedShows > 0 ? `공연 ${sum.reportedShows}건 기준` : '공연 후 직접 기록'}
          />
        </KpiGrid>

        {needReport.length > 0 && (
          <div className="mt-4">
            <SectionTitle>끝난 공연 · 방문객 기록</SectionTitle>
            <p className="mb-2 text-2xs leading-relaxed text-ink-3">
              실제로 몇 분이 오셨는지 적어주셔야 성과가 쌓입니다. 대략이어도 괜찮아요.
            </p>
            <div className="space-y-2">
              {needReport.slice(0, 5).map((s) => (
                <div key={s.id} className="card flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.title}</p>
                    <p className="tnum mt-0.5 text-2xs text-ink-3">
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

        <div className="mt-5">
          <SectionTitle>주간 손님 수</SectionTitle>
          <div className="space-y-2">
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
        </div>

        {soonShows(shows.data, nowIso).length > 0 && (
          <div className="mt-5">
            <SectionTitle>공연 전 확인</SectionTitle>
            <PreShowChecklist
              shows={shows.data}
              venues={venues.data}
              threadIdFor={threadIdFor}
              nowIso={nowIso}
            />
          </div>
        )}

        <div className="mt-5">
          <SectionTitle>공연별 집객</SectionTitle>
          <PerformanceChart shows={shows.data} />
        </div>

        <div className="mt-5">
          <SectionTitle
            right={
              <button
                onClick={() => navigate('/owner/recruit')}
                className="text-2xs font-bold text-ink-2"
              >
                구인 보기
              </button>
            }
          >
            다가오는 공연
          </SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState
              art="stage"
              title="예정된 공연이 없어요"
              description="가능 시간을 열고 구인글을 올리면 공연팀이 지원합니다."
              action={
                <Button
                  variant="brand"
                  onClick={() => navigate(`/host/venue/${venues.data[0].id}/slots`)}
                >
                  가능 시간 열기
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/audience/show/${s.id}`)}
                  className="card flex w-full items-center gap-3 p-3 text-left"
                >
                  {s.artistPhotos[0] ? (
                    <img
                      src={s.artistPhotos[0]}
                      alt=""
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3">
                      <Music4 size={16} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.title}</p>
                    <p className="tnum mt-0.5 text-2xs text-ink-2">
                      {humanDateTime(s.startsAt, nowIso)}
                    </p>
                  </div>
                  <Tag tone="ok">참석 예정 {s.goingCount}</Tag>
                </button>
              ))}
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>

      <ShowReportSheet
        show={reporting}
        open={reporting !== null}
        onClose={() => setReporting(null)}
        onDone={shows.refresh}
      />
    </Screen>
  )
}
