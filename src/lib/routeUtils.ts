/** 탭바·역할 전환 버튼을 숨기는 전체화면 경로 접두사 */
export const FULLSCREEN_PREFIXES = [
  // 여러 스텝을 채우는 등록 폼은 하단 탭을 띄우지 않습니다. 탭이 떠 있으면
  // 제출 버튼과 겹치고, 실수로 탭을 눌러 폼을 벗어나면 흐름이 끊깁니다.
  '/host/venue/new',
  '/artist/new',
  '/audience/book',
  '/audience/review',
  '/chat/',
]

export function isFullscreenRoute(pathname: string): boolean {
  return FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p))
}
