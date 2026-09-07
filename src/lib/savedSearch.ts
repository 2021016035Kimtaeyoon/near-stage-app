import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { distanceKm } from '@/lib/geo'
import { resolvePlace } from '@/store/selectors'
import type { AudienceFilter, SavedFilter, Show, Venue } from '@/types'

/** 필터에서 알림 대조에 쓰는 부분만 떼어냅니다 (검색어·정렬 제외) */
export function toSavedFilter(filter: AudienceFilter): SavedFilter {
  return {
    when: filter.when,
    distance: filter.distance,
    genres: [...filter.genres].sort(),
    price: filter.price,
    ownOnly: filter.ownOnly,
  }
}

/** 같은 조건을 두 번 저장하지 않도록 비교합니다 */
export function sameSavedFilter(a: SavedFilter, b: SavedFilter): boolean {
  return (
    a.when === b.when &&
    a.distance === b.distance &&
    a.price === b.price &&
    a.ownOnly === b.ownOnly &&
    a.genres.length === b.genres.length &&
    a.genres.every((g, i) => g === b.genres[i])
  )
}

const WHEN_LABEL: Record<SavedFilter['when'], string> = {
  tonight: '오늘 밤',
  weekend: '주말',
  all: '전체 기간',
}

const PRICE_LABEL: Record<SavedFilter['price'], string> = {
  all: '가격 전체',
  free: '무료',
  under10k: '1만원 이하',
}

/** 조건을 사람이 읽는 한 줄로 — 목록·알림 본문에 그대로 씁니다 */
export function describeSavedFilter(f: SavedFilter): string {
  const parts: string[] = [WHEN_LABEL[f.when]]
  parts.push(f.distance === 0 ? '거리 전체' : `${f.distance}km 이내`)
  if (f.genres.length > 0) parts.push(f.genres.join('·'))
  if (f.price !== 'all') parts.push(PRICE_LABEL[f.price])
  if (f.ownOnly) parts.push('우리 무대만')
  return parts.join(' · ')
}

/** 이름을 비워두고 저장했을 때 붙일 기본 이름 */
export function autoSavedSearchName(f: SavedFilter): string {
  const genre = f.genres.length === 0 ? '공연' : f.genres.length === 1 ? f.genres[0] : `${f.genres[0]} 외 ${f.genres.length - 1}`
  const near = f.distance === 0 ? '어디서든' : `${f.distance}km 안`
  return `${near} ${genre}`
}

/**
 * 새로 열린 공연이 이 관심 조건에 걸리는지.
 *
 * ★ 기간(`when`)은 일부러 보지 않습니다. "새 공연 알림"의 대상은 앞으로 열릴 공연인데,
 * '오늘 밤'으로 저장해 둔 조건이 내일 확정된 공연을 통째로 걸러내면 알림이 영영 오지
 * 않습니다. 장소·장르·가격 조건만 대조하고, 이미 끝난 공연만 제외합니다.
 * (화면 필터는 기간까지 그대로 적용되므로, 조건을 눌러 적용했을 때와는 결과가 다를 수 있습니다)
 */
export function showMatchesSavedFilter(
  f: SavedFilter,
  show: Show,
  venues: Venue[],
  nowIso: string,
): boolean {
  const end = new Date(show.startAt).getTime() + show.durationMin * 60_000
  if (end < new Date(nowIso).getTime()) return false
  if (f.ownOnly && show.source !== 'own') return false
  // 장르를 모르는 공연(등록 공연의 목록 밖 분류)은 장르 조건에 걸리지 않습니다.
  // 밴드를 찾는 사람에게 분류 불명 공연을 밀어넣지 않기 위함입니다.
  if (f.genres.length > 0 && (!show.genre || !f.genres.includes(show.genre))) return false
  if (f.price === 'free' && show.ticketPrice !== 0) return false
  if (f.price === 'under10k' && show.ticketPrice > 10_000) return false

  const place = resolvePlace(show, venues)
  if (!place) return false
  if (f.distance !== 0) {
    const d = distanceKm(DEFAULT_USER_LOCATION, { lat: place.lat, lng: place.lng })
    if (d > f.distance) return false
  }
  return true
}
