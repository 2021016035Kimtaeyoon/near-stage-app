/**
 * 카카오 OIDC 토큰 교환 — Supabase Edge Function.
 *
 * 왜 필요한가
 *  Supabase 의 카카오 OAuth provider 는 scope 에 account_email 을 하드코딩해 넣습니다.
 *  카카오는 동의항목에 설정되지 않은 항목을 요청하면 KOE205 로 거부하고,
 *  '카카오계정(이메일)'은 비즈 앱이 아니면 설정 자체가 불가능합니다.
 *  → OAuth 리다이렉트 방식으로는 카카오 로그인을 켤 수 없습니다.
 *
 *  대신 카카오의 OpenID Connect 를 씁니다. 우리가 authorize URL 을 직접 만들면
 *  scope 를 'openid profile_nickname profile_image' 로 정할 수 있습니다.
 *  받은 code 를 id_token 으로 바꾸는 일만 서버가 해야 하는데(카카오 토큰
 *  엔드포인트는 CORS 를 허용하지 않고 client secret 이 필요합니다), 그게 이 함수입니다.
 *
 * 신뢰 경계
 *  이 함수는 신분을 만들어내지 않습니다. 카카오가 서명한 id_token 을 그대로
 *  돌려주기만 하고, 검증은 Supabase 가 카카오 공개키(JWKS)로 직접 합니다.
 *  따라서 이 함수가 뚫려도 남의 계정으로 로그인할 수는 없습니다.
 *
 * 필요한 시크릿
 *  - KAKAO_REST_API_KEY   : 카카오 앱 키의 REST API 키
 *  - KAKAO_CLIENT_SECRET  : 카카오 로그인 → 보안에서 만든 값 (사용함 상태여야 합니다)
 */

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'

/** 로그인 화면을 띄울 수 있는 출처만 허용합니다 */
const ALLOWED_ORIGINS = [
  'http://localhost:5250',
  'http://localhost:5173',
  'https://2021016035kimtaeyoon.github.io',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors })
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST 만 허용합니다' }, { status: 405, headers: cors })
  }

  const restKey = Deno.env.get('KAKAO_REST_API_KEY')
  const clientSecret = Deno.env.get('KAKAO_CLIENT_SECRET')
  if (!restKey) {
    return Response.json(
      { error: 'KAKAO_REST_API_KEY 시크릿이 없습니다' },
      { status: 500, headers: cors },
    )
  }

  let body: { code?: string; redirect_uri?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '잘못된 요청 본문' }, { status: 400, headers: cors })
  }

  const { code, redirect_uri: redirectUri } = body
  if (!code || !redirectUri) {
    return Response.json({ error: 'code 와 redirect_uri 가 필요합니다' }, { status: 400, headers: cors })
  }
  // 임의의 주소로 code 를 흘리지 않도록 되돌아갈 곳도 제한합니다
  if (!ALLOWED_ORIGINS.some((o) => redirectUri.startsWith(o))) {
    return Response.json({ error: '허용되지 않은 redirect_uri' }, { status: 400, headers: cors })
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: restKey,
    redirect_uri: redirectUri,
    code,
  })
  if (clientSecret) form.set('client_secret', clientSecret)

  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form,
  })
  const json = await res.json()

  if (!res.ok || !json.id_token) {
    // 카카오의 원문 오류를 그대로 넘겨 원인을 찾을 수 있게 합니다
    return Response.json(
      {
        error: '카카오 토큰 교환 실패',
        kakao: { status: res.status, error: json.error, description: json.error_description },
      },
      { status: 400, headers: cors },
    )
  }

  // id_token 만 돌려줍니다. access_token 은 우리가 쓸 일이 없어 넘기지 않습니다.
  return Response.json({ id_token: json.id_token }, { headers: cors })
})
