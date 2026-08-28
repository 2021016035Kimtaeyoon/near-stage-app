/** 탭바·역할 전환 버튼을 숨기는 전체화면 경로 접두사 */
export const FULLSCREEN_PREFIXES = [
  '/audience/book',
  '/audience/ticket',
  '/audience/review',
  '/chat/',
  '/demo',
]

export function isFullscreenRoute(pathname: string): boolean {
  return FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p))
}
