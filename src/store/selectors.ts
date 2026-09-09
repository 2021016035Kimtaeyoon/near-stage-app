import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { dayRange, showEndMs, tonightRange, weekendRange } from '@/lib/datetime'
import { runsInRange } from '@/lib/showSchedule'
import { distanceKm } from '@/lib/geo'
import type {
  AppNotification,
  AudienceFilter,
  Genre,
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
  // 등록 공연은 기간이 길어서 시작 시각 + 길이로 보면 첫날 뒤에 전부 종료가 됩니다
  const end = showEndMs(show)
  if (now < start) return '공연확정'
  if (now < end) return '진행중'
  return '종료'
}

/**
 * 목록에 실려 오는 아티스트 정보 — 이름·장르·사진뿐입니다.
 *
 * ★ 예전에는 이 자리에 Performer 를 `as` 로 억지로 끼워 넣었습니다. 실제로는 네
 *   필드만 채워져 있는데 타입은 전부 있다고 말해서, 공연 상세가 undefined 에
 *   .toLocaleString() 을 부르며 통째로 크래시했습니다. 컴파일러가 잡을 수 있도록
 *   있는 것만 있다고 적습니다. 전체 정보가 필요하면 useArtist 로 따로 읽습니다.
 */
export interface ShowArtistBrief {
  id: string
  teamName: string
  genre: Genre | null
  photoSeed: string
}

export interface ShowWithMeta {
  show: Show
  place: ShowPlace
  distanceKm: number
  performer: ShowArtistBrief | null
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

/**
 * 처음 들어온 사람이 보는 기본값.
 *
 * ★ 예전 기본값은 "오늘 밤 + 2km" 였습니다. 기본 지도 중심(연남동)과 실제 등록된
 *   공간이 30km 떨어져 있어서, 링크를 받아 처음 연 사람은 무조건 "조건에 맞는
 *   공연이 없어요"를 봤습니다. 유입이 첫 화면에서 전부 죽습니다.
 *
 *   거리를 전체로 엽니다. "오늘 밤"은 이 서비스의 성격이라 남겨두고, 결과가 0이면
 *   무엇을 풀면 몇 건이 나오는지 화면이 알려줍니다(relaxSuggestion).
 */
export const DEFAULT_FILTER: AudienceFilter = {
  when: 'tonight',
  distance: 0,
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
  // ★ 날짜를 고른 경우 그 하루가 조건입니다. when 은 무시합니다 —
  //   "9월 20일"과 "오늘 밤"이 동시에 켜져 있으면 무엇을 보는지 알 수 없습니다.
  if (filter.date) range = dayRange(filter.date)
  else if (filter.when === 'tonight') range = tonightRange(nowIso)
  else if (filter.when === 'weekend') range = weekendRange(nowIso)

  const q = filter.query.trim().toLowerCase()

  const filtered = items.filter(({ show, place, distanceKm: d, performer }) => {
    // 취소된 공연은 목록에서 뺍니다. 상세는 열립니다 — 참석 예정을 눌러둔 분이
    // 사유를 봐야 하니까요.
    if (show.status === '종료' && show.cancelReason) return false
    // 이미 끝난 공연은 목록에서 제외
    if (showEndMs(show) < now) return false
    if (range) {
      // ★ 시작 시각만 보면 안 됩니다. 등록 공연은 두 달을 공연하는 경우가 있어서,
      //   9월 1일 시작해 11월까지 하는 연극이 "오늘 밤"에 절대 걸리지 않았습니다.
      //   기간이 겹치는지를 봐야 오늘 저녁에 실제로 하는 공연이 나옵니다.
      const start = new Date(show.startAt).getTime()
      if (showEndMs(show) < range.from || start > range.to) return false
      // ★ 기간이 겹치는 것만으로는 "그 날 공연한다"가 아닙니다. 74일짜리 연극이
      //   74일 내내 뜨던 이유입니다. 시간 안내에서 공연 요일을 읽어낼 수 있으면
      //   그 기간에 공연이 있는 날이 하나라도 있어야 남깁니다.
      //   ★ null(못 읽음)은 거르지 않습니다 — 모르는 것을 없다고 하면 실제
      //     공연이 목록에서 사라집니다.
      if (runsInRange(show.scheduleNote, range.from, range.to) === false) return false
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
        // ★ '클래식', '뮤지컬', '무용'은 우리 장르 목록에 없습니다. 원본 표기까지
        //   훑어야 검색으로라도 찾을 수 있습니다.
        show.genreLabel ?? '',
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

/**
 * 결과가 0일 때 한 단계 넓힌 조건을 찾아 알려줍니다.
 *
 * ★ 빈 화면을 그냥 보여주면 사용자는 "공연이 없는 서비스"라고 결론 내리고 떠납니다.
 *   조건을 조여서 0이 된 것인지, 정말 공연이 없는 것인지 구분해서 말해줘야 합니다.
 *
 * ★ 자동으로 적용하지 않고 "무엇을 풀면 몇 건이 나오는지"만 돌려줍니다. 사용자가
 *   고른 조건을 몰래 바꾸면 지금 보고 있는 목록이 무엇인지 알 수 없게 됩니다.
 */
export function relaxSuggestion(
  items: ShowWithMeta[],
  filter: AudienceFilter,
  nowIso: string,
): { label: string; patch: Partial<AudienceFilter>; count: number } | null {
  if (items.length === 0) return null

  // 좁힌 순서의 역순으로 하나씩 풀어봅니다. 먼저 결과가 나오는 것을 제안합니다.
  const candidates: Array<{ label: string; patch: Partial<AudienceFilter> }> = []
  if (filter.query.trim()) candidates.push({ label: '검색어 지우기', patch: { query: '' } })
  if (filter.genres.length > 0) candidates.push({ label: '장르 조건 풀기', patch: { genres: [] } })
  if (filter.ownOnly) candidates.push({ label: '등록 공연까지 보기', patch: { ownOnly: false } })
  if (filter.when !== 'all') candidates.push({ label: '전체 기간으로 보기', patch: { when: 'all' } })
  if (filter.distance !== 0) candidates.push({ label: '거리 전체로 보기', patch: { distance: 0 } })

  for (const c of candidates) {
    const n = filterShows(items, { ...filter, ...c.patch }, nowIso).length
    if (n > 0) return { ...c, count: n }
  }

  // 하나만 풀어도 안 되면 전부 풉니다
  const relaxed: AudienceFilter = { ...DEFAULT_FILTER, when: 'all' }
  const all = filterShows(items, relaxed, nowIso).length
  if (all > 0) return { label: '조건 모두 풀기', patch: relaxed, count: all }
  return null
}
