/**
 * 서비스 전역 상수.
 * 서비스명·수수료·기준 시각 등 "나중에 바뀔 수 있는 값"은 전부 여기 모읍니다.
 */

/** 서비스명 (가칭). 이 값만 바꾸면 앱 전체 표기가 바뀝니다. */
export const SERVICE_NAME = 'NEAR:STAGE'
export const SERVICE_TAGLINE = '오늘 밤, 우리 동네 무대'
export const SERVICE_DESCRIPTION =
  '공연할 곳이 없는 아티스트와 손님이 필요한 공간을 연결하고, 그렇게 만들어진 공연을 지도로 유통합니다.'

/**
 * ★ 데모 기준 시각.
 * 실제 시스템 시각을 쓰지 않고 이 값을 앱 전체의 "지금"으로 사용합니다.
 * 언제 시연해도 "오늘 밤" 필터에 결과가 나오도록 고정되어 있습니다.
 * (시연자 패널에서 임시로 변경 가능)
 */
export const DEMO_NOW_ISO = '2026-09-05T19:00:00+09:00'

/** 관객 기본 위치 — 서울 마포구 연남동 중심 */
export const DEFAULT_USER_LOCATION = { lat: 37.562, lng: 126.925 } as const

/** 매칭 수수료 (공간주가 지원자를 수락할 때 결제) */
export const PLATFORM_FEE = 10_000
/** 관객 예약금 (입장 시 전액 차감 — 노쇼 방지) */
export const DEPOSIT_AMOUNT = 1_000

/** localStorage 키 & 스키마 버전 (버전이 바뀌면 자동 초기화) */
export const STORAGE_KEY = 'oneul-mudae-store'
export const STORAGE_VERSION = 4

/** 데모용 고정 주인공 */
export const DEMO_OWNER_VENUE_ID = 'v1' // 카페 온화
export const DEMO_PERFORMER_ID = 'p7' // 실없는사람들 (스탠드업)
export const DEMO_AUDIENCE_NAME = '김관객'

/** 아이폰 프레임 규격 */
export const PHONE_WIDTH = 390
export const PHONE_HEIGHT = 844
