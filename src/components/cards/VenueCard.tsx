import { CheckCircle2, MapPin, TriangleAlert, Users } from 'lucide-react'
import { Tag } from '@/components/ui/Badge'
import { PosterArt, Rating } from '@/components/ui/PosterArt'
import { cn } from '@/lib/cn'
import { priceLabel } from '@/lib/datetime'
import { distanceLabel, walkLabel } from '@/lib/geo'
import type { MatchResult, Venue } from '@/types'

interface Props {
  venue: Venue
  distanceKm?: number
  /** 공연자 화면에서 자동 계산된 조건 충족 여부 */
  match?: MatchResult
  onClick?: () => void
  right?: React.ReactNode
}

export function VenueCard({ venue, distanceKm: d, match, onClick, right }: Props) {
  const genre = venue.preferredGenres[0] ?? '밴드'
  return (
    <article className="card card-hover flex gap-3 p-3">
      <button onClick={onClick} className="flex min-w-0 flex-1 gap-3 text-left">
        <PosterArt
          seed={venue.photoSeed}
          genre={genre}
          className="h-[84px] w-[84px] shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Tag>{venue.category}</Tag>
            {venue.isContracted && <Tag tone="ok">계약 공간</Tag>}
            {match &&
              (match.allSatisfied ? (
                <Tag tone="ok">
                  <CheckCircle2 size={10} /> 조건 충족
                </Tag>
              ) : (
                <Tag tone="warn">
                  <TriangleAlert size={10} /> {match.totalCount - match.satisfiedCount}개 부족
                </Tag>
              ))}
          </div>
          <h3 className="mt-1.5 truncate text-[15px] font-bold leading-snug">{venue.name}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-ink-2">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{venue.address}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={venue.rating} count={venue.reviewCount} />
            <span className="tnum flex items-center gap-1 text-2xs text-ink-3">
              <Users size={11} />
              {venue.capacity}명
            </span>
            {d !== undefined && (
              <span className="tnum text-2xs text-ink-3">
                {distanceLabel(d)} · {walkLabel(d)}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                'tnum text-sm font-bold',
                venue.rentalFee === 0 ? 'text-ok' : 'text-ink',
              )}
            >
              {venue.rentalFee === 0 ? '대여료 무료 · 수익배분' : `대여료 ${priceLabel(venue.rentalFee)}`}
            </span>
          </div>
        </div>
      </button>
      {right}
    </article>
  )
}
