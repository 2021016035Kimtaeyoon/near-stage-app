import { SERVICE_NAME } from '@/config/brand'
import { toast } from '@/store/useToast'
import type { Show } from '@/types'

/**
 * 공연 상세 딥링크. HashRouter라 `#/audience/show/:id`가 그대로 공유 가능한 주소가 됩니다.
 * (해시 앞부분은 현재 접속 주소를 그대로 써서, 로컬·배포 어디서든 열리는 링크가 됩니다)
 */
export function showDeepLink(showId: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/audience/show/${showId}`
}

/**
 * 공유 — 기기가 지원하면 OS 공유 시트를, 아니면 클립보드 복사로 넘어갑니다.
 * 예전엔 아무것도 하지 않고 "복사되었습니다" 토스트만 띄우고 있었습니다.
 */
export async function shareShow(show: Show): Promise<void> {
  const url = showDeepLink(show.id)
  const title = `${show.title} · ${SERVICE_NAME}`

  if (navigator.share) {
    try {
      await navigator.share({ title, text: show.description, url })
      return
    } catch (err) {
      // 사용자가 공유 시트를 닫은 경우는 실패가 아니므로 조용히 끝냅니다
      if (err instanceof DOMException && err.name === 'AbortError') return
      // 그 외 오류는 클립보드로 폴백
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    toast('링크가 복사되었습니다', 'success', url)
  } catch {
    toast('링크를 복사하지 못했어요', 'error', '주소창의 링크를 직접 복사해주세요')
  }
}

/** 클립 딥링크 — 그 클립부터 열리는 주소 */
export function clipDeepLink(clipId: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/audience/clips/${clipId}`
}

/**
 * 클립 공유. 공유할 게 영상 자체가 아니라 "이 팀의 이 무대"라서, 문구에 팀 이름을
 * 넣습니다 — 링크만 던지면 받은 사람이 뭘 볼지 모릅니다.
 */
export async function shareClip(clip: {
  id: string
  title: string
  artistName: string
}): Promise<void> {
  const url = clipDeepLink(clip.id)
  const title = `${clip.artistName} · ${SERVICE_NAME}`
  const text = clip.title || `${clip.artistName}의 무대를 보세요`

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    toast('링크가 복사되었습니다', 'success', url)
  } catch {
    toast('링크를 복사하지 못했어요', 'error', '주소창의 링크를 직접 복사해주세요')
  }
}
