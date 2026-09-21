//
// 클립 공유 미리보기(OG 이미지) — Supabase Edge Function.
//
// ★ 왜 서버를 거쳐야 하는가.
//   이 앱은 HashRouter 를 씁니다. 주소가 '.../#/audience/clips/abc' 인데,
//   '#' 뒤는 브라우저가 서버에 아예 보내지 않습니다. 그래서 카카오톡·문자·슬랙이
//   링크 미리보기를 만들려고 그 주소를 열어봐도, 서버는 클립이 무엇인지 알 방법이
//   없고 index.html 에 박아둔 사이트 대표 이미지만 매번 돌려줍니다. 클립 100개를
//   공유해도 미리보기는 전부 똑같았습니다.
//
//   이 함수는 쿼리스트링(?id=)으로 클립 id 를 받습니다 — '#' 과 달리 쿼리스트링은
//   서버로 그대로 전달되므로, 여기서 그 클립의 진짜 정보(팀 이름·썸네일)를 찾아
//   그때그때 다른 og:image/og:title 을 넣은 HTML을 만들어 줄 수 있습니다.
//
// ★ 사람과 크롤러를 다르게 대접합니다.
//   크롤러(카카오톡 미리보기 봇 등)는 이 HTML 을 그대로 읽고 og: 태그만 봅니다.
//   사람이 링크를 눌러 여는 경우에는 진짜 앱 화면(그 클립이 재생되는 화면)으로
//   즉시 넘겨야 합니다. meta refresh 는 크롤러 대부분이 무시하고, JS 리다이렉트는
//   크롤러가 실행하지 않으므로 — 둘 다 넣으면 크롤러는 og: 태그만 읽고, 사람은
//   0초 만에 진짜 화면으로 넘어갑니다.
//
// ★ 이미지를 새로 만들지 않습니다. 클립의 thumb_url(업로드 클립은 첫 프레임,
//   링크 클립은 유튜브 썸네일)을 그대로 씁니다 — 이미 있는 걸 또 만들 이유가
//   없고, Canvas 합성은 실패 지점만 늘립니다.
//
// 필요한 시크릿 (supabase secrets set)
//  - SITE_URL : 실제 서비스 주소. 예) https://near-stage.pages.dev
//    아직 배포 전이라면 http://localhost:5250 처럼 지금 쓰는 개발 주소를 넣어도
//    됩니다 — 사람 리다이렉트가 그 주소로 갑니다. 안 넣으면 리다이렉트 없이
//    미리보기 HTML만 보여줍니다(빈 화면보다는 못하지만 링크가 죽지는 않습니다).
//  - SUPABASE_URL / SUPABASE_ANON_KEY 는 런타임이 자동 주입합니다.
//    ★ service_role 이 아니라 anon 키를 씁니다. 이 함수는 누구나 열어보는
//      공개 페이지라 service_role 을 여기 두면 그 권한이 그대로 노출됩니다.
//      artist_clips 는 승인된 팀 것만 anon 에게 공개돼 있어(0014) anon 으로
//      충분합니다.
//

import { createClient } from 'jsr:@supabase/supabase-js@2'

const FALLBACK_TITLE = 'NEAR:STAGE — 오늘 밤, 우리 동네 무대'
const FALLBACK_DESC =
  '공연할 곳이 없는 아티스트와 손님이 필요한 공간을 연결하고, 그렇게 만들어진 공연을 지도로 보여줍니다.'

/** og:title/og:description 은 사용자가 적은 텍스트라, 그대로 넣으면 따옴표나
 *  꺾쇠괄호가 HTML을 깨뜨립니다. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function page(opts: {
  title: string
  description: string
  image: string | null
  redirectTo: string | null
}): string {
  const title = escapeHtml(opts.title)
  const description = escapeHtml(opts.description)
  const image = opts.image ? escapeHtml(opts.image) : null

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="video.other" />
<meta property="og:site_name" content="NEAR:STAGE" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
${image ? `<meta property="og:image" content="${image}" />` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${image}" />` : ''}
${opts.redirectTo ? `<meta http-equiv="refresh" content="0; url=${escapeHtml(opts.redirectTo)}" />` : ''}
</head>
<body>
${opts.redirectTo ? `<script>location.replace(${JSON.stringify(opts.redirectTo)})</script>` : ''}
<p>${title}</p>
${opts.redirectTo ? `<p><a href="${escapeHtml(opts.redirectTo)}">NEAR:STAGE 에서 보기</a></p>` : ''}
</body>
</html>`
}

function respond(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const clipId = url.searchParams.get('id')
  const siteUrl = Deno.env.get('SITE_URL')?.replace(/\/$/, '') ?? null

  // 잘못된 링크. 클립 목록으로라도 보내는 게 죽은 링크보다 낫습니다.
  // id 는 uuid 입니다. 형식이 아니면 DB 를 부르지 않고 바로 기본 미리보기로 보냅니다.
  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  if (!clipId || !isUuid(clipId)) {
    return respond(
      page({
        title: FALLBACK_TITLE,
        description: FALLBACK_DESC,
        image: null,
        redirectTo: siteUrl ? `${siteUrl}/#/audience/clips` : null,
      }),
    )
  }

  const redirectTo = siteUrl ? `${siteUrl}/#/audience/clips/${clipId}` : null

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )

    // ★ select 문자열은 리터럴로 둡니다 — 상수로 빼면 결과 타입 추론이 깨집니다
    // (프론트 훅들과 같은 이유). 여기선 타입을 안 쓰지만 관례를 맞춥니다.
    const { data, error } = await supabase
      .from('artist_clips')
      .select('title,thumb_url,artists!artist_clips_artist_id_fkey(team_name)')
      .eq('id', clipId)
      .maybeSingle()

    // 클립이 없거나(지워졌거나) 심사 중인 팀 것이면(RLS가 걸러 null) 사이트
    // 기본 미리보기로 넘어갑니다 — 크래시 대신 있는 정보만 보여줍니다.
    if (error || !data) {
      return respond(
        page({ title: FALLBACK_TITLE, description: FALLBACK_DESC, image: null, redirectTo }),
      )
    }

    type ArtistJoin = { team_name: string } | { team_name: string }[] | null
    const artist = data.artists as ArtistJoin
    const teamName = (Array.isArray(artist) ? artist[0]?.team_name : artist?.team_name) || '어느 팀'

    return respond(
      page({
        title: `${teamName} · NEAR:STAGE`,
        description: data.title?.trim() || `${teamName}의 무대를 지금 보세요`,
        image: data.thumb_url || null,
        redirectTo,
      }),
    )
  } catch (e) {
    console.error('clip-og 실패', clipId, e instanceof Error ? e.message : e)
    return respond(
      page({ title: FALLBACK_TITLE, description: FALLBACK_DESC, image: null, redirectTo }),
    )
  }
})
