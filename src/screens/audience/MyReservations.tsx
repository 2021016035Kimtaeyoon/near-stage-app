import { MapPin, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PosterArt } from '@/components/ui/PosterArt'
import { humanDateTime, won } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import type { Reservation } from '@/types'

export function MyReservations() {
  const navigate = useNavigate()
  const reservations = useAppStore((s) => s.reservations)
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const nowIso = useAppStore((s) => s.demoNowIso)

  const rows = reservations
    .map((r) => {
      const show = shows.find((s) => s.id === r.showId)
      return show ? { reservation: r, show } : null
    })
    .filter((x): x is { reservation: Reservation; show: NonNullable<typeof x>['show'] } => x !== null)
    .sort((a, b) => new Date(b.show.startAt).getTime() - new Date(a.show.startAt).getTime())

  if (rows.length === 0) {
    return (
      <EmptyState
        art="ticket"
        title="예약 내역이 없어요"
        description="관심 있는 공연을 찾아 예약금 1,000원으로 자리를 잡아보세요."
        action={
          <button
            onClick={() => navigate('/audience/home')}
            className="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white"
          >
            공연 둘러보기
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {rows.map(({ reservation, show }) => {
        const place = resolvePlace(show, venues)
        const performer = performers.find((p) => p.id === show.performerId)
        const ended = new Date(show.startAt).getTime() + show.durationMin * 60_000 < new Date(nowIso).getTime()
        return (
          <button
            key={reservation.id}
            onClick={() => navigate(`/audience/ticket/${reservation.id}`)}
            className="card flex w-full gap-3 p-3 text-left"
          >
            <PosterArt
              seed={show.id + (performer?.photoSeed ?? show.title)}
              genre={show.genre}
              className="h-16 w-16 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Tag tone={reservation.status === '취소' ? 'danger' : ended ? 'default' : 'ok'}>
                  {reservation.status === '취소' ? '취소됨' : ended ? '종료' : reservation.status}
                </Tag>
                <span className="tnum text-2xs text-ink-3">{reservation.headcount}명</span>
              </div>
              <p className="mt-1 truncate text-sm font-bold">{show.title}</p>
              <p className="tnum mt-0.5 flex items-center gap-1 truncate text-xs text-ink-2">
                <MapPin size={11} className="shrink-0" />
                {place?.name} · {humanDateTime(show.startAt, nowIso)}
              </p>
              <p className="tnum mt-1 text-2xs text-ink-3">예약금 {won(reservation.depositPaid)}원 결제</p>
            </div>
            <div className="flex shrink-0 items-center text-ink-3">
              <QrCode size={20} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
