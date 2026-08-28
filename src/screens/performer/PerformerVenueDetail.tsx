import { CheckCircle2, MapPin, MessageCircle, TriangleAlert, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { MiniMap } from '@/components/map/MiniMap'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PosterArt, Rating } from '@/components/ui/PosterArt'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { priceLabel } from '@/lib/datetime'
import { matchNeeds } from '@/lib/match'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

export function PerformerVenueDetail() {
  const { venueId } = useParams<{ venueId: string }>()
  const navigate = useNavigate()
  const venue = useAppStore((s) => s.venues.find((v) => v.id === venueId))
  const performer = useAppStore((s) => s.performers.find((p) => p.id === s.currentPerformerId))
  const ensureThread = useAppStore((s) => s.ensureThread)
  const sendMessage = useAppStore((s) => s.sendMessage)

  if (!venue || !performer) {
    return (
      <Screen>
        <ScreenHeader title="공간 상세" back />
        <EmptyState art="search" title="공간을 찾을 수 없어요" />
      </Screen>
    )
  }

  const match = matchNeeds(performer, venue)

  const startInquiry = () => {
    const threadId = ensureThread(venue.id, performer.id)
    sendMessage(
      threadId,
      'performer',
      `안녕하세요! ${performer.teamName}입니다. ${venue.name} 공연 문의드립니다.`,
    )
    toast('공간에 문의 메시지를 보냈습니다', 'success')
    navigate(`/chat/${threadId}`)
  }

  return (
    <Screen>
      <ScreenHeader title={venue.name} subtitle={venue.category} back />
      <ScreenBody padded={false}>
        <PosterArt seed={venue.photoSeed} genre={venue.preferredGenres[0] ?? '밴드'} className="h-[180px] w-full" />

        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5">
            <Tag>{venue.category}</Tag>
            {venue.isContracted && <Tag tone="ok">계약 공간</Tag>}
          </div>
          <h1 className="mt-2 text-xl font-extrabold">{venue.name}</h1>
          <div className="mt-1.5 flex items-center gap-3">
            <Rating value={venue.rating} count={venue.reviewCount} />
            <span className="tnum flex items-center gap-1 text-xs text-ink-3">
              <Users size={12} /> 최대 {venue.capacity}명
            </span>
          </div>
          <p className="tnum mt-2 text-sm font-bold">
            {venue.rentalFee === 0 ? '대여료 무료 · 수익배분' : `대여료 ${priceLabel(venue.rentalFee)}`}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{venue.ownerNote}</p>

          <div className="mt-3 flex items-start gap-1.5 text-[13px] text-ink-2">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            {venue.address}
          </div>
          <MiniMap lat={venue.lat} lng={venue.lng} genre={venue.preferredGenres[0] ?? '밴드'} className="mt-3 h-32 w-full" />
        </div>

        <section className="mt-5 border-t border-border px-4 py-5">
          <h2 className="mb-3 text-[15px] font-bold">
            내 조건과 자동 대조 · {match.satisfiedCount}/{match.totalCount} 충족
          </h2>
          <div className="space-y-2">
            {match.checks.map((c) => (
              <div
                key={c.need.key}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs"
              >
                <span className={c.ok ? 'text-ink-2' : 'font-semibold text-warn'}>
                  {c.need.label} 필요
                </span>
                <span
                  className={
                    c.ok
                      ? 'flex items-center gap-1 font-semibold text-ok'
                      : 'flex items-center gap-1 font-bold text-warn'
                  }
                >
                  {c.ok ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}
                  {c.actualLabel}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="px-4 pb-4">
          <TabBarSpacer />
        </div>
      </ScreenBody>

      <div className="border-t border-border px-4 py-3.5 pb-[calc(var(--safe-bottom)+14px)]">
        <Button full variant="brand" size="lg" leading={<MessageCircle size={17} />} onClick={startInquiry}>
          공연 문의하기
        </Button>
      </div>
    </Screen>
  )
}
