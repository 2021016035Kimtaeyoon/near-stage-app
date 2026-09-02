import { isSameDay } from 'date-fns'
import { CalendarDays, ChevronRight, QrCode, TrendingUp, Users, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader, SectionTitle } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { GenreTag, Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiCard, KpiGrid } from '@/components/ui/Kpi'
import { PosterArt } from '@/components/ui/PosterArt'
import { humanDateTime, won } from '@/lib/datetime'
import {
  computeOwnerKpis,
  pendingApplicantsForVenue,
  upcomingShowsForVenue,
} from '@/store/ownerSelectors'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import { PerformanceChart } from './PerformanceChart'

export function OwnerDashboard() {
  const navigate = useNavigate()
  const venueId = useAppStore((s) => s.currentVenueId)
  const venue = useAppStore((s) => s.venues.find((v) => v.id === venueId))
  const shows = useAppStore((s) => s.shows)
  const performers = useAppStore((s) => s.performers)
  const settlements = useAppStore((s) => s.settlements)
  const weeklyStats = useAppStore((s) => s.weeklyStats)
  const posts = useAppStore((s) => s.posts)
  const reservations = useAppStore((s) => s.reservations)
  const checkInReservation = useAppStore((s) => s.checkInReservation)
  const nowIso = useAppStore((s) => s.demoNowIso)

  if (!venue) {
    return (
      <Screen>
        <ScreenHeader title="대시보드" />
        <EmptyState art="stage" title="공간 정보를 찾을 수 없어요" />
      </Screen>
    )
  }

  const kpis = computeOwnerKpis(venueId, shows, settlements, weeklyStats, nowIso)
  const myStats = weeklyStats.filter((w) => w.venueId === venueId)
  const upcoming = upcomingShowsForVenue(venueId, shows, nowIso).slice(0, 4)
  const pending = pendingApplicantsForVenue(venueId, posts)

  const now = new Date(nowIso)
  const todayShowIds = new Set(
    shows.filter((sh) => sh.venueId === venueId && isSameDay(new Date(sh.startAt), now)).map((sh) => sh.id),
  )
  const todayCheckIns = reservations
    .filter((r) => todayShowIds.has(r.showId) && r.status !== '취소')
    .map((r) => ({ reservation: r, show: shows.find((sh) => sh.id === r.showId)! }))

  return (
    <Screen>
      <ScreenHeader title={venue.name} subtitle="호스트 대시보드" />
      <ScreenBody>
        {pending.length > 0 && (
          <button
            onClick={() => navigate('/owner/recruit')}
            className="bg-gold-500 mb-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-gold-ink"
          >
            <span>
              <span className="block text-[13px] font-extrabold">
                대기 중인 지원자 {pending.length}명
              </span>
              <span className="mt-0.5 block text-2xs text-gold-ink/75">
                지금 확인하고 매칭을 완료해보세요
              </span>
            </span>
            <ChevronRight size={20} />
          </button>
        )}

        <SectionTitle>이번 달 한눈에</SectionTitle>
        <KpiGrid>
          <KpiCard icon={CalendarDays} label="이번 달 공연 수" value={`${kpis.monthShowCount}건`} tone="brand" />
          <KpiCard icon={Users} label="총 예약 관객" value={`${kpis.monthReserved}명`} />
          <KpiCard
            icon={TrendingUp}
            label="예상 추가 집객"
            value={`+${kpis.estimatedExtraAudience}명`}
            hint="공연 유무 방문객 차이 기반"
          />
          <KpiCard icon={Wallet} label="정산 예정액" value={`${won(kpis.pendingSettlement)}원`} />
        </KpiGrid>

        <div className="mt-5">
          <PerformanceChart stats={myStats} />
        </div>

        {todayCheckIns.length > 0 && (
          <div className="mt-5">
            <SectionTitle>오늘 입장 확인</SectionTitle>
            <div className="space-y-2">
              {todayCheckIns.map(({ reservation, show }) => (
                <div key={reservation.id} className="card flex items-center gap-3 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                    <QrCode size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{show.title}</p>
                    <p className="tnum mt-0.5 text-xs text-ink-2">{reservation.headcount}명 · {reservation.qrCode}</p>
                  </div>
                  {reservation.status === '입장완료' ? (
                    <Tag tone="ok">입장완료</Tag>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (checkInReservation(reservation.id)) toast('입장 처리되었습니다', 'success')
                      }}
                    >
                      입장 처리
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <SectionTitle
            right={
              <button
                onClick={() => navigate('/owner/recruit')}
                className="text-2xs font-bold text-ink-2"
              >
                전체보기
              </button>
            }
          >
            다가오는 공연
          </SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState
              art="stage"
              title="예정된 공연이 없어요"
              description="구인글을 올리거나 긴급 매칭으로 빈 시간을 채워보세요."
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((show) => {
                const performer = performers.find((p) => p.id === show.performerId)
                return (
                  <div key={show.id} className="card flex items-center gap-3 p-3">
                    <PosterArt
                      seed={show.id + (performer?.photoSeed ?? show.title)}
                      genre={show.genre}
                      className="h-12 w-12 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{show.title}</p>
                      <p className="tnum mt-0.5 text-xs text-ink-2">
                        {humanDateTime(show.startAt, nowIso)}
                      </p>
                    </div>
                    <GenreTag genre={show.genre} size="sm" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
