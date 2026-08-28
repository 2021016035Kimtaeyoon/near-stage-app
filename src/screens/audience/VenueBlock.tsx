import { MapPin, Users } from 'lucide-react'
import { MiniMap } from '@/components/map/MiniMap'
import { Tag } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/PosterArt'
import { distanceLabel, walkLabel } from '@/lib/geo'
import type { Genre, ShowPlace } from '@/types'

interface OwnDetail {
  rating: number
  reviewCount: number
  isContracted: boolean
}

export function VenueBlock({
  place,
  genre,
  distanceKm,
  own,
}: {
  place: ShowPlace
  genre: Genre
  distanceKm: number
  own?: OwnDetail
}) {
  return (
    <section className="border-t border-border px-4 py-5">
      <h2 className="mb-3 text-[15px] font-bold">공간</h2>
      <div className="flex items-center gap-1.5">
        <Tag>{place.category}</Tag>
        {own?.isContracted && <Tag tone="ok">계약 공간</Tag>}
      </div>
      <h3 className="mt-1.5 text-[16px] font-extrabold">{place.name}</h3>
      {own && (
        <div className="mt-1">
          <Rating value={own.rating} count={own.reviewCount} />
        </div>
      )}
      <div className="mt-2 flex items-start gap-1.5 text-[13px] text-ink-2">
        <MapPin size={13} className="mt-0.5 shrink-0" />
        <span>{place.address}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <span className="tnum flex items-center gap-1 text-2xs text-ink-3">
          <Users size={12} />
          최대 {place.capacity}명
        </span>
        <span className="tnum text-2xs text-ink-3">
          {distanceLabel(distanceKm)} · {walkLabel(distanceKm)}
        </span>
      </div>

      <MiniMap
        lat={place.lat}
        lng={place.lng}
        genre={genre}
        className="mt-3 h-[140px] w-full"
      />
    </section>
  )
}
