import { getKakaoToken } from '@/hooks/useKakaoLogin'
import { supabase } from '@/lib/supabase'

/**
 * 카카오톡 "나에게 보내기".
 *
 * ★ 문구에 "예매"라는 말을 쓰지 않습니다. 약관에 "참석 예정은 좌석을 보장하는
 *   예약이 아닙니다"라고 적어놨습니다. 메시지가 예매처럼 읽히면 관객이 자리를
 *   보장받았다고 오해하고, 그 책임이 우리에게 옵니다.
 *
 * ★ 실패는 조용히 넘어갑니다. 참석 예정 자체는 이미 저장됐고 메시지는 덤입니다.
 *   동의를 거절했거나(-402), 토큰이 만료됐거나(-401), 구글로 로그인했거나 —
 *   어느 경우든 사용자가 할 수 있는 게 없는 실패라 화면에 띄우지 않습니다.
 *
 * ★ 메시지 안 링크의 도메인은 카카오 콘솔의 "사이트 도메인"에 등록돼 있어야
 *   합니다. 등록되지 않은 주소를 넣으면 카카오가 전송을 거절합니다. 그래서
 *   localhost 가 아니라 배포 주소(VITE_SITE_URL)를 씁니다.
 */

/** 카카오가 허용하는 링크 도메인. 로컬에서도 배포 주소를 씁니다 */
function siteBase(): string {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured && !configured.includes('localhost')) return configured.replace(/\/$/, '')
  // 배포 주소가 아직 없으면 링크 없이 보냅니다 — 없는 주소를 넣는 것보다 낫습니다
  return ''
}

export interface MemoResult {
  sent: boolean
  reason?: string
}

/** 카카오로 로그인해서 메시지 토큰이 있는 세션인지 */
export function canSendKakaoMemo(): boolean {
  return !!getKakaoToken()
}

async function send(text: string, path: string, buttonTitle: string): Promise<MemoResult> {
  const accessToken = getKakaoToken()
  if (!accessToken) return { sent: false, reason: 'no_token' }

  const base = siteBase()
  try {
    const { data, error } = await supabase.functions.invoke('kakao-memo', {
      body: {
        accessToken,
        text,
        linkUrl: base ? `${base}/#${path}` : undefined,
        buttonTitle,
      },
    })
    if (error) return { sent: false, reason: error.message }
    return { sent: !!data?.sent, reason: data?.reason }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'unknown' }
  }
}

/** 참석 예정 등록 확인 */
export function sendAttendanceMemo(input: {
  showId: string
  title: string
  whenLabel: string
  venueName: string
  headcount: number
}): Promise<MemoResult> {
  const text = [
    '[NEAR:STAGE] 참석 예정으로 등록했어요',
    '',
    input.title,
    `${input.whenLabel} · ${input.venueName}`,
    `${input.headcount}명`,
    '',
    '좌석을 지정하는 예약은 아니에요. 자리는 현장에서 안내받습니다.',
  ].join('\n')
  return send(text, `/audience/show/${input.showId}`, '공연 보기')
}
