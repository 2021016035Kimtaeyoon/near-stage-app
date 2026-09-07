/**
 * 서비스 전역 상수.
 * 서비스명 등 "나중에 바뀔 수 있는 값"은 전부 여기 모읍니다.
 */

/** 서비스명. 이 값만 바꾸면 앱 전체 표기가 바뀝니다. */
export const SERVICE_NAME = 'NEAR:STAGE'
export const SERVICE_TAGLINE = '오늘 밤, 우리 동네 무대'
export const SERVICE_DESCRIPTION =
  '공연할 곳이 없는 아티스트와 손님이 필요한 공간을 연결하고, 그렇게 만들어진 공연을 지도로 유통합니다.'

/**
 * 지도의 기본 중심 — 서울 마포구 연남동.
 *
 * 사용자가 위치 권한을 허용하면 브라우저 좌표를 쓰지만, 그 좌표는 브라우저 밖으로
 * 나가지 않습니다(§8-4). 권한이 없거나 거부했을 때 지도를 어디에 놓을지의 기본값입니다.
 */
export const DEFAULT_MAP_CENTER = { lat: 37.562, lng: 126.925 } as const

/** @deprecated DEFAULT_MAP_CENTER 를 쓰세요. 남은 호출부 정리용 별칭입니다 */
export const DEFAULT_USER_LOCATION = DEFAULT_MAP_CENTER

/**
 * 시범 운영 안내.
 * 결제·수수료·예약금이 전혀 없는 버전이라는 것을 화면마다 밝힙니다.
 */
export const FREE_TRIAL_NOTICE = '현재 시범 운영 기간으로 모든 이용이 무료입니다'

/** 개런티는 플랫폼을 거치지 않는다는 고지 — 구인글·수락·약관에서 함께 씁니다 */
export const FEE_DISCLAIMER =
  '개런티는 호스트와 아티스트가 직접 협의해 현장에서 정산합니다. 플랫폼은 대금에 관여하지 않습니다.'

/** 아이폰 프레임 규격 */
export const PHONE_WIDTH = 390
export const PHONE_HEIGHT = 844
