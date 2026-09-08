/** 탭바·역할 전환 버튼을 숨기는 전체화면 경로 접두사 */
export const FULLSCREEN_PREFIXES = [
  // 여러 스텝을 채우는 등록 폼은 하단 탭을 띄우지 않습니다. 탭이 떠 있으면
  // 제출 버튼과 겹치고, 실수로 탭을 눌러 폼을 벗어나면 흐름이 끊깁니다.
  '/host/venue/new',
  '/artist/new',
  '/audience/review',
  // 공연 상세는 아래에 참석 예정 버튼이 붙어 있는데, 하단 탭이 그 위를 덮어서
  // 버튼 한가운데를 누르면 '마이' 탭으로 가버렸습니다. 뒤로가기 버튼이 왼쪽 위에
  // 따로 있으므로 탭을 숨겨도 길을 잃지 않습니다.
  '/audience/show/',
  '/chat/',
]

export function isFullscreenRoute(pathname: string): boolean {
  return FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p))
}
