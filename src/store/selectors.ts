import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { tonightRange, weekendRange } from '@/lib/datetime'
import { distanceKm } from '@/lib/geo'
import type { AudienceFilter, Performer, Show, ShowPlace, Venue } from '@/types'

/** 공연의 "장소"를 우리 무대/등록 공연 구분 없이 통일해 반환 */
export function resolvePlace(show: Show, venues: Venue[]): ShowPlace | null {
  if (show.source === 'own') {
    const v = venues.find((x) => x.id === show.venueId)
    if (!v) return null
    return {
      name: v.name,
      category: v.category,
      address: v.address,
      district: v.district,
      lat: v.lat,
      lng: v.lng,
      capacity: v.capacity,
      venueId: v.id,
    }
  }
  const kv = show.kopisVenue
  if (!kv) return null
  return {
    name: kv.name,
    category: `공연장 · ${kv.hall}`,
    address: kv.address,
    district: kv.district,
    lat: kv.lat,
    lng: kv.lng,
    capacity: kv.capacity,
    venueId: null,
  }
}

export interface ShowWithMeta {
  show: Show
  place: ShowPlace
  distanceKm: number
  performer: Performer | null
}

export function withMeta(
  shows: Show[],
  venues: Venue[],
  performers: Performer[],
  origin = DEFAULT_USER_LOCATION,
): ShowWithMeta[] {
  const out: ShowWithMeta[] = []
  for (const show of shows) {
    const place = resolvePlace(show, venues)
    if (!place) continue
    out.push({
      show,
      place,
      distanceKm: distanceKm(origin, { lat: place.lat, lng: place.lng }),
      performer: performers.find((p) => p.id === show.performerId) ?? null,
    })
  }
  return out
}

export const DEFAULT_FILTER: AudienceFilter = {
  when: 'tonight',
  distance: 2,
  genres: [],
  price: 'all',
  ownOnly: false,
  query: '',
  sort: 'soon',
}

export function filterShows(
  items: ShowWithMeta[],
  filter: AudienceFilter,
  nowIso: string,
): ShowWithMeta[] {
  const now = new Date(nowIso).getTime()
  let range: { from: number; to: number } | null = null
  if (filter.when === 'tonight') range = tonightRange(nowIso)
  else if (filter.when === 'weekend') range = weekendRange(nowIso)

  const q = filter.query.trim().toLowerCase()

  const filtered = items.filter(({ show, place, distanceKm: d, performer }) => {
    // 이미 끝난 공연은 목록에서 제외
    const end = new Date(show.startAt).getTime() + show.durationMin * 60_000
    if (end < now) return false
    if (range) {
      const start = new Date(show.startAt).getTime()
      if (start < range.from || start > range.to) return false
    }
    if (filter.distance !== 0 && d > filter.distance) return false
    if (filter.genres.length > 0 && !filter.genres.includes(show.genre)) return false
    if (filter.price === 'free' && show.ticketPrice !== 0) return false
    if (filter.price === 'under10k' && show.ticketPrice > 10_000) return false
    if (filter.ownOnly && show.source !== 'own') return false
    if (q) {
      const hay = [
        show.title,
        show.description,
        place.name,
        place.district,
        show.genre,
        performer?.teamName ?? '',
        ...show.tags,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  return sortShows(filtered, filter.sort, nowIso)
}

export function sortShows(
  items: ShowWithMeta[],
  sort: AudienceFilter['sort'],
  nowIso: string,
): ShowWithMeta[] {
  const now = new Date(nowIso).getTime()
  const arr = items.slice()
  switch (sort) {
    case 'soon':
      arr.sort((a, b) => new Date(a.show.startAt).getTime() - new Date(b.show.startAt).getTime())
      break
    case 'near':
      arr.sort((a, b) => a.distanceKm - b.distanceKm)
      break
    case 'likes':
      arr.sort((a, b) => b.show.likes - a.show.likes)
      break
    case 'recommend':
      // 우리 무대 가산 + 임박 + 가까움 + 좋아요를 섞은 점수
      arr.sort((a, b) => recommendScore(b, now) - recommendScore(a, now))
      break
  }
  return arr
}

function recommendScore(item: ShowWithMeta, now: number): number {
  const hoursAway = Math.max(0.5, (new Date(item.show.startAt).getTime() - now) / 3_600_000)
  const ownBonus = item.show.source === 'own' ? 26 : 0
  return ownBonus + 40 / hoursAway + 20 / (1 + item.distanceKm) + Math.min(20, item.show.likes / 12)
}

/** 리뷰를 대상별로 나눠 평균을 계산 */
export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
}
