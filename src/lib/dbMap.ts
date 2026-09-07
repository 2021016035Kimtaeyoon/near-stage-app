import { GENRES, type Genre, type Show, type ShowPlace } from '@/types'

/**
 * DB 행 → 화면이 쓰는 타입.
 *
 * 화면 60여 개를 다시 만들지 않기 위해, 기존 타입(Show/ShowPlace)의 모양을 유지하고
 * 여기서만 변환합니다. DB 컬럼명이 바뀌어도 고칠 곳은 이 파일 하나입니다.
 */

/** v_public_shows 한 행 */
export interface PublicShowRow {
  id: string
  venue_id: string | null
  artist_id: string | null
  slot_id: string | null
  title: string
  description: string
  starts_at: string
  duration_min: number
  capacity: number
  status: 'confirmed' | 'ongoing' | 'ended' | 'canceled'
  source: 'own' | 'kopis'
  kopis_id: string | null
  external_url: string | null
  created_at: string
  venue_name: string | null
  venue_address: string | null
  lat: number | null
  lng: number | null
  venue_category: string | null
  venue_rating: number | null
  artist_name: string | null
  artist_genre: string | null
  artist_photos: string[] | null
  going_count: number
  like_count: number
  avg_rating: number | null
  review_count: number
}

/** DB 상태 → 화면 상태 표기 */
const STATUS_LABEL: Record<PublicShowRow['status'], Show['status']> = {
  confirmed: '공연확정',
  ongoing: '진행중',
  ended: '종료',
  canceled: '종료',
}

function toGenre(raw: string | null): Genre {
  if (raw && (GENRES as readonly string[]).includes(raw)) return raw as Genre
  // 등록 공연(KOPIS)의 원본 분류는 우리 장르 목록에 없을 수 있습니다.
  // 임의로 다른 장르에 끼워 넣지 않고 '연극'을 기본 표기로 씁니다.
  return '연극'
}

/**
 * 주소에서 행정동만 뽑아냅니다 (필터·표기용).
 * "서울 마포구 연남로1길 42" → "연남로1길" 이 아니라 구 단위가 더 유용해서 구를 씁니다.
 */
export function districtFromAddress(address: string | null): string {
  if (!address) return ''
  const m = address.match(/([가-힣]+(?:구|시|군))/)
  return m ? m[1] : ''
}

export function rowToShow(row: PublicShowRow): Show {
  return {
    id: row.id,
    venueId: row.venue_id,
    performerId: row.artist_id,
    startAt: row.starts_at,
    durationMin: row.duration_min,
    title: row.title,
    // 이 서비스는 대금에 관여하지 않습니다. 우리 무대는 참가비가 없고(현장에서 호스트가
    // 정함), 등록 공연은 원본 예매처에서 결제합니다. 그래서 0으로 둡니다.
    ticketPrice: 0,
    capacity: row.capacity,
    reservedCount: row.going_count,
    likes: row.like_count,
    status: STATUS_LABEL[row.status],
    source: row.source,
    tags: [],
    description: row.description,
    genre: toGenre(row.artist_genre),
    ...(row.kopis_id ? { kopisId: row.kopis_id } : {}),
    ...(row.external_url ? { externalUrl: row.external_url } : {}),
  }
}

export function rowToPlace(row: PublicShowRow): ShowPlace | null {
  if (row.lat === null || row.lng === null) return null
  return {
    name: row.venue_name ?? '장소 미정',
    category: row.source === 'own' ? (row.venue_category ?? '공간') : '공연장',
    address: row.venue_address ?? '',
    district: districtFromAddress(row.venue_address),
    lat: row.lat,
    lng: row.lng,
    capacity: row.capacity,
    venueId: row.venue_id,
  }
}

/** v_public_shows 에서 항상 이 컬럼 목록으로 조회합니다 */
export const PUBLIC_SHOW_COLUMNS =
  'id,venue_id,artist_id,slot_id,title,description,starts_at,duration_min,capacity,' +
  'status,source,kopis_id,external_url,created_at,venue_name,venue_address,lat,lng,' +
  'venue_category,venue_rating,artist_name,artist_genre,artist_photos,' +
  'going_count,like_count,avg_rating,review_count'
