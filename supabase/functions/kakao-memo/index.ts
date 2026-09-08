//
// 카카오톡 "나에게 보내기" 중계.
//
// ★ 왜 서버를 거치나: kapi.kakao.com 은 브라우저 CORS 를 허용하지 않습니다.
//   프론트에서 직접 부르면 무조건 막힙니다.
//
// ★ 토큰을 저장하지 않습니다. 요청마다 사용자의 access_token 을 받아 그대로
//   카카오에 넘기고 버립니다. 나중에 보내는 리마인드를 하려면 refresh_token 을
//   보관해야 하는데, 그건 자격증명을 우리가 들고 있는 것이라 개인정보처리방침에
//   항목을 추가해야 합니다. 즉시 확인 메시지는 보관 없이 됩니다.
//
// ★ 실패해도 앱은 계속 굴러가야 합니다. 참석 예정 자체는 이미 DB 에 저장됐고,
//   알림은 덤입니다. 그래서 실패를 200 + { sent: false, reason } 으로 돌려줍니다 —
//   프론트가 에러 화면을 띄우지 않게.
//

const ALLOWED_ORIGINS = [
  'http://localhost:5250',
  'http://localhost:5173',
  'https://2021016035kimtaeyoon.github.io',
  // TODO(배포): Cloudflare Pages 주소를 추가하세요
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

interface Body {
  /** 카카오 access_token (talk_message scope 포함) */
  accessToken?: string
  /** 메시지 본문. 200자 이내로 자릅니다 */
  text?: string
  /** 눌렀을 때 열릴 주소. 카카오에 등록된 사이트 도메인이어야 합니다 */
  linkUrl?: string
  /** 버튼 문구 */
  buttonTitle?: string
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return Response.json({ sent: false, reason: 'method' }, { status: 405, headers: cors })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return Response.json({ sent: false, reason: 'bad_json' }, { headers: cors })
  }

  const { accessToken, text, linkUrl, buttonTitle } = body
  if (!accessToken || !text) {
    return Response.json({ sent: false, reason: 'missing_params' }, { headers: cors })
  }

  // ★ text 템플릿은 link 가 필수입니다. 그 주소의 도메인이 카카오 콘솔의
  //   "사이트 도메인"에 등록돼 있지 않으면 카카오가 거절합니다.
  const template = {
    object_type: 'text',
    text: text.slice(0, 200),
    link: linkUrl ? { web_url: linkUrl, mobile_web_url: linkUrl } : {},
    button_title: (buttonTitle ?? '자세히 보기').slice(0, 14),
  }

  const form = new URLSearchParams()
  form.set('template_object', JSON.stringify(template))

  const res = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: form,
  })

  if (res.ok) {
    return Response.json({ sent: true }, { headers: cors })
  }

  // 카카오가 준 이유를 그대로 돌려줍니다 — 동의항목 미허용(-402)인지
  // 토큰 만료(-401)인지 링크 도메인 문제인지 구분해야 고칠 수 있습니다.
  const detail = await res.text().catch(() => '')
  return Response.json(
    { sent: false, reason: 'kakao_rejected', status: res.status, detail: detail.slice(0, 400) },
    { headers: cors },
  )
})
