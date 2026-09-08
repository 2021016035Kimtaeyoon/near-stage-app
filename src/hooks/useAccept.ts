import { describeDbError, supabase } from '@/lib/supabase'

/**
 * 지원 수락 → 공연 생성 (§11).
 *
 * ★ 여기서 직접 shows 에 INSERT 하지 않습니다. shows 에는 INSERT 정책이 아예 없고,
 *   오직 이 함수만 공연을 만들 수 있습니다. 수락 한 번에 일곱 가지가 같이 일어나야
 *   하는데 — 지원 수락, 다른 지원 자동 거절, 구인글 마감, 공연 생성, 슬롯 잠금,
 *   알림 3종, 대화방 생성 — 프론트에서 순서대로 부르면 중간에 실패했을 때
 *   "공연은 만들어졌는데 슬롯은 안 잠긴" 상태가 남습니다. DB 트랜잭션이 답입니다.
 */
export async function acceptApplication(
  applicationId: string,
  slotId: string,
): Promise<{ showId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('fn_accept_application', {
    p_application_id: applicationId,
    p_slot_id: slotId,
  })
  if (error) return { showId: null, error: describeDbError(error) }
  return { showId: (data as string) ?? null, error: null }
}
