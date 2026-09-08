import { describeDbError, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { CLIP_BUCKET } from '@/lib/uploadClip'

/**
 * 신고 · 계정 삭제 (§16).
 *
 * ★ 신고는 신고한 사람과 운영자만 봅니다. 신고당한 쪽에게 누가 신고했는지 보이면
 *   보복이 일어나고, 그러면 아무도 신고하지 않습니다.
 */

export type ReportTarget = 'venue' | 'artist' | 'clip' | 'comment' | 'show'
export type ReportReason = 'spam' | 'sexual' | 'violence' | 'copyright' | 'false_info' | 'other'

export const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'spam', label: '광고 · 스팸' },
  { value: 'false_info', label: '허위 정보' },
  { value: 'sexual', label: '성적인 내용' },
  { value: 'violence', label: '폭력 · 혐오' },
  { value: 'copyright', label: '저작권 침해' },
  { value: 'other', label: '기타' },
]

export async function submitReport(input: {
  targetType: ReportTarget
  targetId: string
  reason: ReportReason
  detail: string
}): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const { error } = await supabase.from('reports').insert({
    reporter_id: uid,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    detail: input.detail,
  })
  if (!error) return null
  // 같은 대상을 두 번 신고한 경우 — 실패로 보여줄 일이 아닙니다
  if (error.code === '23505') return '이미 신고하신 대상이에요'
  return describeDbError(error)
}

/**
 * 계정 삭제.
 *
 * ★ Storage 파일은 DB 연쇄 삭제로 지워지지 않아 먼저 지웁니다. 실패해도 계정
 *   삭제는 진행합니다 — 파일이 남는 것보다 계정을 못 지우는 게 더 큰 문제입니다.
 *
 * ★ 공연 기록이 있는 호스트는 예전 구조에서 삭제가 아예 실패했습니다
 *   (shows_source_shape CHECK 위반). fn_delete_my_account 가 내 공연을 먼저
 *   지운 뒤 계정을 삭제합니다(0016).
 */
export async function deleteMyAccount(): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'

  // ① 내 폴더의 파일부터 (베스트 에포트)
  for (const bucket of ['venue-photos', 'artist-photos', CLIP_BUCKET]) {
    try {
      const { data } = await supabase.storage.from(bucket).list(uid)
      const paths = (data ?? []).map((f) => `${uid}/${f.name}`)
      if (paths.length > 0) await supabase.storage.from(bucket).remove(paths)
    } catch {
      /* 파일 삭제 실패가 계정 삭제를 막지는 않습니다 */
    }
  }

  // ② 계정과 데이터
  const { error } = await supabase.rpc('fn_delete_my_account')
  if (error) return describeDbError(error)

  // ③ 로컬 세션 정리. 서버에서 사용자가 사라졌으니 토큰도 버립니다
  await supabase.auth.signOut()
  return null
}
