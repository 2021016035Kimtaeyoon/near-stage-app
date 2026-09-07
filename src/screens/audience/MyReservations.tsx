import { Check, MapPin, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PosterArt } from '@/components/ui/PosterArt'
import { humanDateTime } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore, useNow } from '@/store/useAppStore'
import type { Reservation } from '@/types'

export function MyReservations() {
  const navigate = useNavigate()
  const reservations = useAppStore((s) => s.reservations)
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const reviews = useAppStore((s) => s.reviews)
  const myName = useAppStore((s) => s.profile?.displayName ?? '')
  const nowIso = useNow()

  // 내가 이미 후기를 남긴 공연 — 중복 작성 유도를 막습니다
  const myReviewedShowIds = new Set(
    reviews.filter((r) => r.authorName === myName).map((r) => r.showId),
  )

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
        description="관심 있는 공연에 참석 예정을 눌러두면 여기 모입니다."
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
        // 리뷰는 우리 무대(공간·공연자가 실재하는 공연)에만 쓸 수 있습니다 — ReviewCompose와 같은 조건
        const reviewable =
          ended && reservation.status !== '취소' && show.source === 'own' && !!show.venueId && !!show.performerId
        const alreadyReviewed = myReviewedShowIds.has(show.id)
        return (
          <div key={reservation.id} className="card overflow-hidden">
          <button
            onClick={() => navigate(`/audience/ticket/${reservation.id}`)}
            className="flex w-full gap-3 p-3 text-left"
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
            </div>
            <div className="flex shrink-0 items-center text-ink-3">
              <QrCode size={20} />
            </div>
          </button>

          {/* 관람이 끝나면 여기서 바로 후기를 남깁니다 — 예전엔 리뷰 화면이 완성돼 있는데
              진입 버튼이 없어 어디서도 도달할 수 없었습니다. */}
          {reviewable && (
            <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
              <p className="text-2xs text-ink-2">
                {alreadyReviewed ? '후기를 남겨주셔서 감사해요' : '공연은 어떠셨나요? 후기 30P'}
              </p>
              {alreadyReviewed ? (
                <Tag tone="ok">
                  <Check size={10} /> 후기 작성 완료
                </Tag>
              ) : (
                <button
                  onClick={() => navigate(`/audience/review/${show.id}`)}
                  className="bg-gold-500 shrink-0 rounded-lg px-3 py-1.5 text-2xs font-bold text-gold-ink"
                >
                  후기 남기기
                </button>
              )}
            </div>
          )}
          </div>
        )
      })}
    </div>
  )
}
