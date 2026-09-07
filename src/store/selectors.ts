import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { tonightRange, weekendRange } from '@/lib/datetime'
import { distanceKm } from '@/lib/geo'
import type {
  AppNotification,
  AudienceFilter,
  Performer,
  Role,
  Show,
  ShowPlace,
  Venue,
} from '@/types'

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
    // 홀 이름을 카테고리 자리에 넣으면 "공연장 · 공연장"처럼 중복되거나,
    // 우리 무대의 카페/바(진짜 카테고리)와 의미가 섞입니다 — hall로 분리합니다.
    category: '공연장',
    hall: kv.hall && kv.hall !== '공연장' ? kv.hall : undefined,
    address: kv.address,
    district: kv.district,
    lat: kv.lat,
    lng: kv.lng,
    capacity: kv.capacity,
    venueId: null,
  }
}

/**
 * 실제 "지금"(demoNowIso) 기준으로 계산하는 공연 상태.
 * `Show.status`는 확정 시점에 한 번만 기록되는 정적 필드라 시간이 지나도 저절로
 * 바뀌지 않습니다 — 진행중/종료 여부가 필요하면 이 함수로 매번 다시 계산하세요.
 */
/**
 * 이 역할에게 실제로 보이는 알림만 추립니다.
 * `audienceScope: 'followers'` 알림은 해당 팀을 팔로우한 사람에게만 노출되므로,
 * 탭바·마이페이지 배지 숫자도 반드시 같은 기준으로 세야 합니다.
 * (안 그러면 배지에 1이 떠 있는데 알림센터를 열면 비어 있는 상태가 됩니다)
 */
export function visibleNotifications(
  notifications: AppNotification[],
  role: Role,
  followedPerformerIds: string[],
): AppNotification[] {
  return notifications.filter(
    (n) =>
      n.role === role &&
      (n.audienceScope !== 'followers' || followedPerformerIds.includes(n.performerId ?? '')),
  )
}

/** 위 기준으로 센 미읽음 개수 — 배지 숫자는 전부 이 함수를 씁니다 */
export function unreadNotificationCount(
  notifications: AppNotification[],
  role: Role,
  followedPerformerIds: string[],
): number {
  return visibleNotifications(notifications, role, followedPerformerIds).filter((n) => !n.read)
    .length
}

export function getShowStatus(show: Show, nowIso: string): Show['status'] {
  if (show.status === '모집중' || show.status === '매칭완료') return show.status
  const now = new Date(nowIso).getTime()
  const start = new Date(show.startAt).getTime()
  const end = start + show.durationMin * 60_000
  if (now < start) return '공연확정'
  if (now < end) return '진행중'
  return '종료'
}

export interface ShowWithMeta {
  show: Show
  place: ShowPlace
  distanceKm: number
  performer: Performer | null
  /**
   * 공간·공연자 평점 평균. 등록 공연(KOPIS)은 우리 플랫폼에 등록된 평점 데이터가
   * 없으므로 null — 별점순 정렬 시 자연스럽게 맨 뒤로 밀립니다.
   */
  rating: number | null
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
    const venue = show.venueId ? venues.find((v) => v.id === show.venueId) : undefined
    const performer = performers.find((p) => p.id === show.performerId) ?? null
    const rating = venue
      ? performer
        ? Math.round(((venue.rating + performer.rating) / 2) * 10) / 10
        : venue.rating
      : null
    out.push({
      show,
      place,
      distanceKm: distanceKm(origin, { lat: place.lat, lng: place.lng }),
      performer,
      rating,
    })
  }
  return out
}

export const DEFAULT_FILTER: AudienceFilter = {
  when: 'tonight',
  distance: 2,
  genres: [],
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
    // 장르를 모르는 공연(등록 공연의 목록 밖 분류)은 장르 필터에 걸리지 않습니다
    if (filter.genres.length > 0 && (!show.genre || !filter.genres.includes(show.genre)))
      return false
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
    case 'rating':
      arr.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
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
