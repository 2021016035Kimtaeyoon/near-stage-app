import { MapPin, PenLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShowPoster } from '@/components/ui/ShowPoster'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyAttendances } from '@/hooks/useEngagement'
import { usePublicShows } from '@/hooks/usePublicShows'
import { humanDateTime, showEndMs } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'

/**
 * 내 참석 예정 (§12).
 *
 * 예매가 아니라 "참석 예정"입니다 — 결제도 좌석 지정도 없고, QR 티켓도 없습니다.
 * 호스트가 대략 몇 명 오는지 알기 위한 숫자입니다. 그래서 화면도 티켓처럼 꾸미지
 * 않습니다. 티켓처럼 보이면 관객이 자리를 보장받았다고 오해합니다.
 */
export function MyReservations() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const attendances = useMyAttendances()
  const shows = usePublicShows()

  if (!userId) {
    return (
      <EmptyState
        art="ticket"
        title="로그인하면 참석 예정을 볼 수 있어요"
        description="공연에 참석 예정을 눌러두면 여기 모입니다."
      />
    )
  }

  if (attendances.loading || shows.loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    )
  }

  const rows = attendances.data
    .map((a) => {
      const meta = shows.data.find((x) => x.show.id === a.showId)
      return meta ? { attendance: a, meta } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort(
      (a, b) =>
        new Date(b.meta.show.startAt).getTime() - new Date(a.meta.show.startAt).getTime(),
    )

  if (rows.length === 0) {
    return (
      <EmptyState
        art="ticket"
        title="참석 예정인 공연이 없어요"
        description="관심 있는 공연에 참석 예정을 눌러두면 여기 모입니다."
        action={
          <Button variant="brand" onClick={() => navigate('/audience/home')}>
            공연 둘러보기
          </Button>
        }
      />
    )
  }

  const now = new Date(nowIso).getTime()

  return (
    <div className="space-y-2.5">
      {rows.map(({ attendance, meta }) => {
        const show = meta.show
        const ended = showEndMs(show) < now
        const canceled = attendance.status === 'canceled'
        const canReview = ended && !canceled && show.source === 'own'

        return (
          <div key={show.id} className="card overflow-hidden">
            <button
              onClick={() => navigate(`/audience/show/${show.id}`)}
              className="flex w-full gap-3 p-3.5 text-left"
            >
              <ShowPoster
                posterUrl={show.posterUrl ?? undefined}
                seed={show.id + show.title}
                genre={show.genre}
                className="h-16 w-16 shrink-0 rounded-xl"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold">{show.title}</span>
                  <Tag tone={canceled ? 'danger' : ended ? 'default' : 'ok'}>
                    {canceled ? '취소함' : ended ? '종료' : '참석 예정'}
                  </Tag>
                </span>
                <span className="tnum mt-0.5 block text-2xs text-ink-2">
                  {humanDateTime(show.startAt, nowIso)}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-2xs text-ink-3">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{meta.place.name}</span>
                </span>
                {!canceled && (
                  <span className="tnum mt-0.5 block text-2xs text-ink-3">
                    {attendance.headcount}명
                  </span>
                )}
              </span>
            </button>

            {canReview && (
              <Button
                variant="ghost"
                full
                size="sm"
                leading={<PenLine size={13} />}
                className="border-t border-border"
                onClick={() => navigate(`/audience/review/${show.id}`)}
              >
                리뷰 쓰기
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
