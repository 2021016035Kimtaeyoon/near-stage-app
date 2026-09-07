import { CalendarDays, ChevronRight, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GenreTag } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiCard, KpiGrid } from '@/components/ui/Kpi'
import { PosterArt } from '@/components/ui/PosterArt'
import { humanDateTime } from '@/lib/datetime'
import { PerformanceChart } from '@/screens/owner/PerformanceChart'
import {
  computeOwnerKpis,
  pendingApplicantsForVenue,
  upcomingShowsForVenue,
} from '@/store/ownerSelectors'
import { useAppStore, useNow } from '@/store/useAppStore'

/** 데스크톱 홈 — 공간주용. KPI·성과 리포트·다가오는 공연을 한 화면 그리드로 */
export function DesktopOwnerHome() {
  const navigate = useNavigate()
  const venueId = useAppStore((s) => s.currentVenueId)
  const venue = useAppStore((s) => s.venues.find((v) => v.id === venueId))
  const shows = useAppStore((s) => s.shows)
  const performers = useAppStore((s) => s.performers)
  const weeklyStats = useAppStore((s) => s.weeklyStats)
  const posts = useAppStore((s) => s.posts)
  const nowIso = useNow()

  if (!venue) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState art="stage" title="공간 정보를 찾을 수 없어요" />
      </div>
    )
  }

  const kpis = computeOwnerKpis(venue.id, shows, weeklyStats, nowIso)
  const myStats = weeklyStats.filter((w) => w.venueId === venue.id)
  const upcoming = upcomingShowsForVenue(venue.id, shows, nowIso).slice(0, 6)
  const pending = pendingApplicantsForVenue(venue.id, posts)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{venue.name}</h1>
            <p className="mt-1 text-sm text-ink-2">호스트 대시보드 · 데스크톱 홈</p>
          </div>
          {pending.length > 0 && (
            <button
              onClick={() => navigate('/desktop/owner/recruit')}
              className="bg-gold-500 flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold text-gold-ink"
            >
              대기 중인 지원자 {pending.length}명 확인하기
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <KpiGrid className="md:grid-cols-4">
          <KpiCard icon={CalendarDays} label="이번 달 공연 수" value={`${kpis.monthShowCount}건`} tone="brand" />
          <KpiCard icon={Users} label="총 예약 관객" value={`${kpis.monthReserved}명`} />
          <KpiCard icon={TrendingUp} label="예상 추가 집객" value={`+${kpis.estimatedExtraAudience}명`} />
        </KpiGrid>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <PerformanceChart stats={myStats} />

          <div className="card p-5">
            <h2 className="mb-4 text-[15px] font-bold">다가오는 공연</h2>
            {upcoming.length === 0 ? (
              <EmptyState art="stage" title="예정된 공연이 없어요" />
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((show) => {
                  const performer = performers.find((p) => p.id === show.performerId)
                  return (
                    <div key={show.id} className="flex items-center gap-3">
                      <PosterArt
                        seed={show.id + (performer?.photoSeed ?? show.title)}
                        genre={show.genre}
                        className="h-11 w-11 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{show.title}</p>
                        <p className="tnum text-xs text-ink-2">{humanDateTime(show.startAt, nowIso)}</p>
                      </div>
                      <GenreTag genre={show.genre} size="sm" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
