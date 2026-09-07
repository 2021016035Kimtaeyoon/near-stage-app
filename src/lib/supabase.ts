import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase 클라이언트 — 앱 전체가 이 하나를 공유합니다.
 *
 * 여러 개를 만들면 인증 세션 갱신이 서로 어긋나서, 한쪽에서 토큰을 새로 받는 동안
 * 다른 쪽이 만료된 토큰으로 요청을 보내는 일이 생깁니다.
 *
 * ★ 여기 들어가는 publishable key 는 브라우저에 노출되는 것이 정상입니다.
 *   접근 제어는 전부 DB의 RLS 정책이 합니다(supabase/migrations/0003_rls.sql).
 *   secret key 는 프론트에 절대 넣지 않습니다 — RLS를 통째로 우회합니다.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** 환경변수가 없으면 로그인·데이터 없이 화면만 도는 상태가 됩니다 */
export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[supabase] .env.local 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없습니다. ' +
      '로그인과 데이터 조회가 동작하지 않습니다.',
  )
}

export const supabase: SupabaseClient = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // 카카오 로그인이 ?code=... 를 붙여 돌아오면 클라이언트가 알아서 세션으로 바꿉니다.
    // HashRouter 를 쓰기 때문에 쿼리스트링이 해시 앞에 붙어도 문제 없습니다.
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

/**
 * PostgREST 에러를 사람이 읽는 한 문장으로.
 * 화면은 이 문장을 그대로 보여주고, 원문은 콘솔에만 남깁니다.
 */
export function describeDbError(error: { code?: string; message?: string } | null): string {
  if (!error) return ''
  switch (error.code) {
    case '42501':
      return '권한이 없습니다. 로그인 상태와 소유 여부를 확인해 주세요.'
    case '23505':
      return '이미 등록된 내용입니다.'
    case '23503':
      return '연결된 정보를 찾을 수 없습니다.'
    case 'P0001':
      // fn_accept_application 등에서 우리가 직접 던진 메시지는 그대로 보여줍니다
      return error.message ?? '처리할 수 없는 요청입니다.'
    case 'P0002':
      return error.message ?? '대상을 찾을 수 없습니다.'
    case 'PGRST116':
      return '대상을 찾을 수 없습니다.'
    default:
      return error.message ?? '알 수 없는 오류가 발생했습니다.'
  }
}
