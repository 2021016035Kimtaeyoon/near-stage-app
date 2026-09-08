import { Heart, MapPin, Users } from 'lucide-react'
import { GenreTag, SourceBadge, StatusDot } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/PosterArt'
import { ShowPoster } from '@/components/ui/ShowPoster'
import { cn } from '@/lib/cn'
import { countdownLabel, showPriceLabel, showWhenLabel } from '@/lib/datetime'
import { distanceLabel } from '@/lib/geo'
import type { ShowWithMeta } from '@/store/selectors'

interface Props {
  item: ShowWithMeta
  nowIso: string
  liked?: boolean
  onClick?: () => void
  onToggleLike?: () => void
  /** 데모에서 새로 생긴 공연 강조 */
  highlighted?: boolean
  compact?: boolean
}

export function ShowCard({
  item,
  nowIso,
  liked = false,
  onClick,
  onToggleLike,
  highlighted = false,
  compact = false,
}: Props) {
  const { show, place, distanceKm: d, performer, rating } = item
  const countdown = countdownLabel(show, nowIso)
  const live = countdown === '진행 중'
  const seatsLeft = Math.max(0, show.capacity - show.reservedCount)
  // 등록 공연은 우리가 정원을 모릅니다. capacity 0 을 "매진"으로 표시하면 거짓이 됩니다.
  const hasSeatInfo = show.source === 'own' && show.capacity > 0
  // ticketPrice 는 모든 공연이 0 이라 색 판정에 쓸 수 없습니다. 우리 무대는 참가비가
  // 없고, 등록 공연은 원본 안내 문장에 '무료'가 있을 때만 무료입니다.
  const isFree = show.source === 'own' || /무료/.test(show.priceNote ?? '')

  return (
    <article
      className={cn(
        'card card-hover relative flex gap-3 p-3 text-left',
        highlighted && 'border-gold-600/70',
      )}
      style={
        highlighted
          ? { boxShadow: '0 0 0 1px rgba(255,196,46,.35), 0 8px 28px rgba(255,196,46,.18)' }
          : undefined
      }
    >
      <button onClick={onClick} className="flex min-w-0 flex-1 gap-3 text-left">
        <ShowPoster
          posterUrl={show.posterUrl}
          seed={show.id + (performer?.photoSeed ?? show.title)}
          genre={show.genre}
          className={cn('shrink-0 rounded-xl', compact ? 'h-16 w-16' : 'h-[84px] w-[84px]')}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <SourceBadge source={show.source} size="sm" />
            {live ? (
              <StatusDot label="진행 중" tone="live" />
            ) : (
              <StatusDot label={countdown} tone="soon" />
            )}
          </div>
          <h3 className="mt-1.5 truncate text-[15px] font-bold leading-snug">{show.title}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-ink-2">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">
              {place.name} · {place.district}
            </span>
            <span className="tnum shrink-0 text-ink-3">{distanceLabel(d)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <GenreTag genre={show.genre} size="sm" />
            {rating !== null && <Rating value={rating} size={11} />}
            <span className="tnum text-2xs text-ink-3">{showWhenLabel(show, nowIso)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                'tnum text-sm font-bold',
                isFree ? 'text-ok' : 'text-ink',
              )}
            >
              {showPriceLabel(show.source, show.priceNote)}
            </span>
            <span className="tnum flex items-center gap-1 text-2xs text-ink-3">
              <Users size={11} />
              {hasSeatInfo ? (seatsLeft > 0 ? `${seatsLeft}석 남음` : '정원 마감') : '예매처 예매'}
            </span>
          </div>
        </div>
      </button>

      {onToggleLike && (
        <button
          onClick={onToggleLike}
          aria-label={liked ? '좋아요 취소' : '좋아요'}
          aria-pressed={liked}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-ink-3 active:bg-surface-2"
        >
          <Heart
            size={16}
            className={liked ? 'fill-gold-text text-gold-text' : ''}
            strokeWidth={liked ? 0 : 2}
          />
        </button>
      )}
    </article>
  )
}

/** 지도 마커를 탭했을 때 뜨는 미니 카드 */
export function ShowMiniCard({
  item,
  nowIso,
  onClick,
}: {
  item: ShowWithMeta
  nowIso: string
  onClick: () => void
}) {
  const { show, place, distanceKm: d, performer } = item
  return (
    <button
      onClick={onClick}
      className="flex w-[248px] items-center gap-2.5 p-2.5 text-left"
      style={{ background: 'transparent' }}
    >
      <ShowPoster
        posterUrl={show.posterUrl}
        seed={show.id + (performer?.photoSeed ?? show.title)}
        genre={show.genre}
        className="h-14 w-14 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <SourceBadge source={show.source} size="sm" />
        <div className="mt-1 truncate text-[13px] font-bold leading-snug">{show.title}</div>
        <div className="tnum mt-0.5 truncate text-2xs text-ink-2">
          {showWhenLabel(show, nowIso)} · {place.name}
        </div>
        <div className="tnum mt-0.5 text-2xs text-ink-3">
          {distanceLabel(d)} · {showPriceLabel(show.source, show.priceNote)}
        </div>
      </div>
    </button>
  )
}
