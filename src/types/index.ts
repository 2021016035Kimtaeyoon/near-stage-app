/** NEAR:STAGE — 전 도메인 타입 정의 */

/* ────────────────────────── 공통 ────────────────────────── */

export type Role = 'audience' | 'owner' | 'performer'

/**
 * 로그인한 사용자.
 *
 * ★ 역할은 계정 속성이 아니라 보유 리소스로 판단합니다(§7). 공간을 가지고 있으면 호스트,
 * 팀을 가지고 있으면 아티스트, 아무것도 없으면 관객입니다. 여기에 role을 넣지 마세요.
 */
export interface UserProfile {
  id: string
  displayName: string
  avatarUrl?: string
  isAdmin: boolean
}

export type Genre =
  | '밴드'
  | '마술'
  | '스탠드업'
  | '연극'
  | '토론'
  | '솔로파티'
  | '국악'
  | 'DJ'
  | '싱어송라이터'

export const GENRES: Genre[] = [
  '밴드',
  '마술',
  '스탠드업',
  '연극',
  '토론',
  '솔로파티',
  '국악',
  'DJ',
  '싱어송라이터',
]

export type VenueCategory = '바' | '카페' | '식당' | '공연장' | '스튜디오'
export const VENUE_CATEGORIES: VenueCategory[] = ['바', '카페', '식당', '공연장', '스튜디오']

/* ────────────────────────── 공연 ────────────────────────── */

export type ShowStatus = '모집중' | '매칭완료' | '공연확정' | '진행중' | '종료'
export type ShowSource = 'own' | 'kopis'

/** KOPIS(공연예술통합전산망) 등록 공연장 정보 */
export interface KopisVenueInfo {
  name: string
  hall: string
  address: string
  district: string
  lat: number
  lng: number
  capacity: number
}

export interface Show {
  id: string
  /** 우리 무대일 때만 값이 있음. 등록 공연(kopis)은 null */
  venueId: string | null
  /** 우리 무대일 때만 값이 있음 */
  performerId: string | null
  /** ISO 8601 (KST 오프셋 포함) */
  startAt: string
  /**
   * 등록 공연의 공연 마지막 날(23:59). 대학로 연극처럼 두 달을 공연하는 경우가 있어서,
   * 시작 시각 하나로는 "끝난 공연"으로 잘못 걸러집니다. 우리 무대는 없습니다(null).
   */
  runEndsAt?: string | null
  /** 취소 사유. 취소된 공연에만 있습니다 */
  cancelReason?: string | null
  durationMin: number
  title: string
  /** 0이면 무료 */
  ticketPrice: number
  capacity: number
  reservedCount: number
  likes: number
  status: ShowStatus
  /** ★ 뱃지 구분의 핵심 */
  source: ShowSource
  tags: string[]
  description: string
  /**
   * 우리 장르 목록에 있는 장르. 등록 공연은 목록 밖 분류가 많아 null 일 수 있습니다.
   * null 이면 장르 태그를 달지 말고 genreLabel 을 그대로 보여주세요.
   */
  genre: Genre | null
  /** 원본 장르 표기 (등록 공연의 '서양음악(클래식)' 등). 우리 목록에 맞추지 않습니다 */
  genreLabel?: string
  /**
   * 공연 시간 안내 원문 (등록 공연만). '화요일 ~ 금요일(20:00), 토요일(15:00)'
   *
   * ★ KOPIS 는 공연 기간만 주고 어느 요일에 하는지는 이 문장에만 있습니다.
   *   lib/showSchedule.ts 가 읽어내고, 못 읽으면 원문을 그대로 보여줍니다.
   */
  scheduleNote?: string
  /** KOPIS 오픈API 공연 ID (source==='kopis'일 때) */
  kopisId?: string
  /** 등록 공연의 원본 예매처 링크 (source==='kopis'일 때) */
  externalUrl?: string
  /** 등록 공연의 원본 포스터 이미지 URL. 없으면 PosterArt 로 대체합니다 */
  posterUrl?: string
  /** 가격 안내 원문 (예: '전석 30,000원'). 파싱하지 않고 그대로 보여줍니다 */
  priceNote?: string
  /** KOPIS 공연장 정보 (source==='kopis'일 때) */
  kopisVenue?: KopisVenueInfo
  /** 등록 공연의 출연진 표기 (공연자 계정이 없으므로) */
  kopisCast?: string
  /** KOPIS 원본 장르 표기 (예: '뮤지컬') */
  kopisGenreLabel?: string
}

/** 지도/리스트에서 공연의 "장소"를 통일해 다루기 위한 정규화 타입 */
export interface ShowPlace {
  name: string
  /** 공간 카테고리(카페/바/공연장 …). 홀 이름을 여기 넣지 않습니다 — `hall`을 씁니다 */
  category: string
  /** 등록 공연(KOPIS)의 홀 이름. 우리 무대는 없음 */
  hall?: string
  address: string
  district: string
  lat: number
  lng: number
  capacity: number
  venueId: string | null
}

/* ────────────────────────── 리뷰 ────────────────────────── */

/** ★ 공간 리뷰와 공연 리뷰를 분리해 저장 */
export type ReviewTarget = 'venue' | 'performer'

export interface Review {
  id: string
  showId: string
  targetType: ReviewTarget
  /** 대상 id (venueId 또는 performerId) */
  targetId: string
  rating: number
  text: string
  authorName: string
  createdAt: string
}

/* ────────────────────────── 필터 ────────────────────────── */

export type WhenFilter = 'tonight' | 'weekend' | 'all'
/** 0 = 전체(거리 무제한) */
export type DistanceFilter = 1 | 2 | 5 | 0
export type SortKey = 'soon' | 'near' | 'rating' | 'likes' | 'recommend'

export interface AudienceFilter {
  when: WhenFilter
  /**
   * 특정 날짜만 보기 (YYYY-MM-DD). 값이 있으면 when 보다 우선합니다.
   *
   * ★ 등록 공연은 기간 공연이 많아서 "오늘 밤 / 주말 / 전체" 세 개로는 원하는
   *   날짜를 고를 수 없었습니다. 다음 주 토요일에 뭐 하는지 보려면 날짜가 필요합니다.
   */
  date?: string | null
  distance: DistanceFilter
  genres: Genre[]
  ownOnly: boolean
  query: string
  sort: SortKey
}

/**
 * 관심 조건은 이제 DB(saved_searches)에 있습니다 — hooks/useSavedSearches.ts.
 *
 * ★ 예전에는 여기에 SavedFilter(기간·거리·장르·우리무대만) 스냅샷을 담았습니다.
 *   거리는 서버가 대조할 수 없습니다. 브라우저 좌표를 서버로 보내지 않기 때문에
 *   옛 코드는 연남동 고정 좌표로 거리를 재고 있었고, 그건 사용자의 위치가
 *   아니었습니다. 기간(when)도 "오늘 밤"으로 저장하면 내일 확정된 공연이 통째로
 *   걸러져 알림이 영영 오지 않습니다.
 *
 *   그래서 조건은 장르만 남겼습니다. 대조할 수 없는 것을 조건인 척 두지 않습니다.
 */
