import { Check, ChevronLeft, MapPin, Ticket } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '@/components/shell/ScreenHeader'
import { SourceBadge, Tag } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { QrCanvas } from '@/components/ui/QrCanvas'
import { humanDateTime, won } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

export function TicketScreen() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const navigate = useNavigate()
  const reservations = useAppStore((s) => s.reservations)
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const nowIso = useAppStore((s) => s.demoNowIso)

  const reservation = reservations.find((r) => r.id === reservationId) ?? null
  const show = reservation ? shows.find((s) => s.id === reservation.showId) : null
  const place = show ? resolvePlace(show, venues) : null

  if (!reservation || !show || !place) {
    return (
      <Screen>
        <div className="flex items-center gap-2 px-4 pb-3 pt-12">
          <IconButton label="닫기" onClick={() => navigate('/audience/my')}>
            <ChevronLeft size={22} />
          </IconButton>
        </div>
        <EmptyState art="ticket" title="예약 정보를 찾을 수 없어요" />
      </Screen>
    )
  }

  const cancelled = reservation.status === '취소'

  return (
    <Screen>
      <div className="flex items-center gap-2 px-4 pb-3 pt-12">
        <IconButton label="닫기" onClick={() => navigate('/audience/my')}>
          <ChevronLeft size={22} />
        </IconButton>
        <h1 className="text-[16px] font-bold">QR 티켓</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-2">
        <div className="overflow-hidden rounded-3xl border border-border">
          <div className="brand-gradient px-5 pb-8 pt-6 text-white">
            <div className="flex items-center justify-between">
              <SourceBadge source={show.source} />
              <span className="flex items-center gap-1 text-2xs font-bold opacity-90">
                <Ticket size={12} /> {reservation.headcount}인 입장권
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold leading-snug">{show.title}</h2>
            <p className="tnum mt-1 text-sm opacity-90">{humanDateTime(show.startAt, nowIso)}</p>
          </div>

          <div className="relative bg-white px-5 pb-6 pt-6">
            {/* 절취선 느낌의 반원 노치 */}
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-bg" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-bg" />
            <div
              className="absolute inset-x-5 top-0 border-t border-dashed border-border"
              aria-hidden
            />

            <div className="flex flex-col items-center pt-3">
              <QrCanvas seed={reservation.qrCode} size={168} />
              <p className="tnum mt-3 text-xs font-bold tracking-widest text-ink-2">
                {reservation.qrCode}
              </p>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-border pt-4">
              <div className="flex items-start gap-1.5 text-[13px] text-ink-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>
                  {place.name} · {place.address}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-2">예약 인원</span>
                <span className="tnum font-semibold">{reservation.headcount}명</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-2">예약금 결제</span>
                <span className="tnum font-semibold">{won(reservation.depositPaid)}원</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-2">상태</span>
                <Tag tone={cancelled ? 'danger' : reservation.status === '입장완료' ? 'ok' : 'default'}>
                  {reservation.status === '입장완료' && <Check size={10} />}
                  {reservation.status}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
          입장 시 이 QR 화면을 스태프에게 보여주세요. 예약금은 입장 시 전액 차감됩니다.
        </div>

        <Button full variant="outline" className="mt-4" onClick={() => navigate('/audience/my')}>
          마이 페이지로 돌아가기
        </Button>
      </div>
    </Screen>
  )
}
