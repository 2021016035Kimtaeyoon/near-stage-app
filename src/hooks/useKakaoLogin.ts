import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from '@/store/useToast'

/**
 * 카카오 로그인 — OIDC id_token 방식.
 *
 * Supabase 의 카카오 OAuth provider 는 scope 에 account_email 을 하드코딩해 넣고,
 * 카카오는 비즈 앱이 아니면 그 항목을 설정할 수 없어 KOE205 로 거부합니다.
 * 그래서 리다이렉트를 Supabase 에 맡기지 않고 우리가 직접 만듭니다.
 *
 *   1. 우리가 카카오 authorize URL 을 만든다 (scope: openid profile_nickname profile_image)
 *   2. 카카오가 우리 앱으로 ?code=... 를 붙여 되돌려보낸다
 *   3. code 를 Edge Function 에 보내 id_token 으로 바꾼다
 *      (카카오 토큰 엔드포인트는 CORS 를 안 열고 client secret 이 필요해서 서버가 해야 합니다)
 *   4. supabase.auth.signInWithIdToken 으로 세션을 만든다
 *
 * 4번에서 Supabase 가 카카오 공개키로 id_token 을 직접 검증합니다. 즉 Edge Function 은
 * 신분을 만들어내지 못하고 토큰을 옮기는 역할만 합니다.
 */

const KAKAO_AUTHORIZE = 'https://kauth.kakao.com/oauth/authorize'
const NONCE_KEY = 'ns-kakao-nonce'
const RETURN_KEY = 'ns-kakao-return'

/** 카카오 REST API 키. 브라우저에 노출돼도 되는 값입니다 (client_id 역할) */
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY

export const isKakaoConfigured = Boolean(KAKAO_CLIENT_ID && isSupabaseConfigured)

/**
 * 카카오는 redirect_uri 에 프래그먼트(#)를 허용하지 않습니다.
 * 그래서 앱 루트로 돌아오게 하고, 원래 보던 해시는 따로 기억해 둡니다.
 */
function redirectUri(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 카카오 로그인 시작 — 카카오 동의 화면으로 이동합니다 */
export function startKakaoLogin(): void {
  if (!KAKAO_CLIENT_ID) {
    toast('카카오 로그인 설정이 없어요', 'error', 'VITE_KAKAO_REST_API_KEY 가 필요합니다')
    return
  }
  const nonce = randomNonce()
  sessionStorage.setItem(NONCE_KEY, nonce)
  sessionStorage.setItem(RETURN_KEY, window.location.hash || '#/')

  const url = new URL(KAKAO_AUTHORIZE)
  url.searchParams.set('client_id', KAKAO_CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('response_type', 'code')
  // ★ 우리가 직접 만들기 때문에 account_email 을 넣지 않습니다. 이게 이 방식의 이유입니다.
  url.searchParams.set('scope', 'openid profile_nickname profile_image')
  url.searchParams.set('nonce', nonce)
  window.location.assign(url.toString())
}

/**
 * 카카오가 되돌려준 ?code= 를 세션으로 바꿉니다.
 * 앱 최상단에서 한 번만 호출하세요.
 */
export function useKakaoCallback(): void {
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const kakaoError = params.get('error')

    if (!code && !kakaoError) return
    handled.current = true

    // 주소창에서 code 를 즉시 지웁니다 — 새로고침으로 재사용되면 실패하고,
    // 히스토리에 인가 코드가 남는 것도 좋지 않습니다.
    const back = sessionStorage.getItem(RETURN_KEY) || '#/'
    window.history.replaceState(null, '', `${window.location.pathname}${back}`)

    if (kakaoError) {
      toast('카카오 로그인이 취소됐어요', 'warn', params.get('error_description') ?? undefined)
      return
    }

    const nonce = sessionStorage.getItem(NONCE_KEY) ?? undefined
    sessionStorage.removeItem(NONCE_KEY)
    sessionStorage.removeItem(RETURN_KEY)

    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('kakao-oidc', {
          body: { code, redirect_uri: redirectUri() },
        })
        if (error || !data?.id_token) {
          toast('카카오 로그인에 실패했어요', 'error', data?.error ?? error?.message)
          return
        }
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'kakao',
          token: data.id_token,
          nonce,
        })
        if (signInError) {
          toast('카카오 로그인에 실패했어요', 'error', signInError.message)
          return
        }
        toast('카카오로 로그인했어요', 'success')
      } catch (e) {
        toast('카카오 로그인에 실패했어요', 'error', e instanceof Error ? e.message : undefined)
      }
    })()
  }, [])
}
