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
  run_ends_at: string | null
  cancel_reason: string | null
  duration_min: number
  capacity: number
  status: 'confirmed' | 'ongoing' | 'ended' | 'canceled'
  source: 'own' | 'kopis'
  kopis_id: string | null
  external_url: string | null
  poster_url: string | null
  price_note: string | null
  genre_raw: string | null
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

/**
 * 우리 장르 목록에 있는 값만 Genre 로 인정합니다.
 *
 * ★ 예전에는 목록에 없는 값을 '연극'으로 끼워 넣었는데, 그래서 오케스트라
 *   정기연주회가 '연극'으로 표시됐습니다. 틀린 라벨을 붙이는 것보다 라벨을
 *   달지 않고 원본 표기(genreLabel)를 보여주는 게 맞습니다.
 */
function toGenre(raw: string | null): Genre | null {
  if (raw && (GENRES as readonly string[]).includes(raw)) return raw as Genre
  return null
}

/**
 * 등록 공연(KOPIS)의 장르.
 *
 * ★ 등록 공연은 아티스트가 없어서 artist_genre 가 항상 null 입니다. 그래서 장르가
 *   전부 비어 있었고, 장르 필터를 고르면 무조건 0건이 나왔습니다. 원본 장르는
 *   genre_raw('서양음악(클래식)' 등)에 따로 들어 있는데 아무도 쓰지 않았습니다.
 *
 * ★ 뜻이 분명히 같은 것만 옮깁니다. '서양음악(클래식)'을 '솔로파티'로, '뮤지컬'을
 *   '연극'으로 밀어 넣으면 필터가 거짓말을 하게 됩니다. 옮기지 못한 것은 null 로
 *   두고 원본 표기를 그대로 화면에 보여줍니다 — 그게 사실이니까요.
 */
function kopisGenre(rawLabel: string | null): Genre | null {
  if (!rawLabel) return null
  if (rawLabel.includes('연극')) return '연극'
  if (rawLabel.includes('국악') || rawLabel.includes('한국음악')) return '국악'
  if (rawLabel.includes('마술')) return '마술'
  if (rawLabel.includes('대중음악')) return '밴드'
  return null
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

/**
 * KOPIS 포스터 주소 정규화.
 *
 * 원본은 http://www.kopis.or.kr/... 로 옵니다. 배포 사이트가 https 라서 그대로 쓰면
 * 혼합 콘텐츠로 브라우저가 차단합니다. https 로 바꾸면 www → 루트 도메인으로 301
 * 리다이렉트가 한 번 더 일어나므로, 처음부터 루트 도메인을 씁니다.
 */
function normalizePosterUrl(raw: string | null): string | undefined {
  if (!raw) return undefined
  let url = raw.trim()
  if (url.startsWith('http://')) url = 'https://' + url.slice('http://'.length)
  if (url.startsWith('https://www.kopis.or.kr')) {
    url = 'https://kopis.or.kr' + url.slice('https://www.kopis.or.kr'.length)
  }
  return url
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
    // 정함), 등록 공연은 원본 예매처에서 결제합니다. 그래서 숫자로는 0이고,
    // 등록 공연의 가격은 원본 안내 문장(priceNote)을 그대로 보여줍니다.
    ticketPrice: 0,
    capacity: row.capacity,
    reservedCount: row.going_count,
    runEndsAt: row.run_ends_at,
    cancelReason: row.cancel_reason,
    likes: row.like_count,
    status: STATUS_LABEL[row.status],
    source: row.source,
    tags: [],
    description: row.description,
    genre: toGenre(row.artist_genre) ?? kopisGenre(row.genre_raw),
    // 등록 공연은 KOPIS 원본 표기('서양음악(클래식)' 등)를 그대로 보여줍니다
    ...(row.genre_raw ? { genreLabel: row.genre_raw } : {}),
    ...(row.kopis_id ? { kopisId: row.kopis_id } : {}),
    ...(row.external_url ? { externalUrl: row.external_url } : {}),
    ...(normalizePosterUrl(row.poster_url) ? { posterUrl: normalizePosterUrl(row.poster_url) } : {}),
    ...(row.price_note ? { priceNote: row.price_note } : {}),
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
  'id,venue_id,artist_id,slot_id,title,description,starts_at,run_ends_at,duration_min,capacity,' +
  'status,cancel_reason,source,kopis_id,external_url,poster_url,price_note,genre_raw,created_at,' +
  'venue_name,venue_address,lat,lng,' +
  'venue_category,venue_rating,artist_name,artist_genre,artist_photos,' +
  'going_count,like_count,avg_rating,review_count'
