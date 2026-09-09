//
// KOPIS(공연예술통합전산망) 공연 정보 수집 — Supabase Edge Function.
//
// 왜 Edge Function 인가
//  - KOPIS API 키가 프론트에 노출되면 안 됩니다. 브라우저에서 직접 부르면 키가 그대로
//    번들에 박힙니다. 그래서 서버에서만 부르고, 키는 Supabase 시크릿에 둡니다.
//  - shows 테이블에는 INSERT 정책이 없습니다(0003_rls.sql). service_role 로 실행되는
//    이 함수만 source='kopis' 행을 넣을 수 있습니다.
//
// 무엇을 넣는가
//  - 서울(signgucode=11) 공연만. 지역을 넓히려면 REGION 을 바꾸세요.
//  - kopis_id(mt20id) 로 중복을 막습니다. 매일 돌려도 같은 공연이 늘어나지 않습니다.
//  - 목록을 마지막 페이지까지(최대 MAX_PAGES) 넘깁니다. 전에는 cpage=1 고정이라
//    서울 수백 건 중 앞 100건만 들어왔고, 매번 같은 100건만 갱신됐습니다.
//  - 기간이 그대로고 시간 안내(schedule_note)도 이미 있는 공연은 상세·공연장
//    API를 다시 부르지 않고 지나갑니다. 그게 이 함수에서 가장 비싼 일이라,
//    두 번째 실행부터는 훨씬 빠르고 그만큼 더 멀리 볼 수 있습니다.
//  - TIME_BUDGET_MS 를 넘기면 스스로 멈추고 stoppedEarly: true 를 돌려줍니다.
//    런타임에 끊기면 통계도 못 남기고, 어디까지 됐는지 알 수 없습니다.
//    다음 실행이 건너뛰기 덕분에 이어받습니다.
//  - 좌표가 없으면 카카오 로컬 API로 주소를 좌표로 바꿔 저장합니다. 좌표가 없으면
//    지도에 찍을 수 없어 목록에서도 빠지므로, 지오코딩에 실패한 공연은 건너뜁니다.
//
// 필요한 시크릿 (supabase secrets set)
//  - KOPIS_API_KEY      : 예술경영지원센터에서 발급
//  - KAKAO_REST_API_KEY : 주소→좌표 변환용
//  - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 런타임이 자동 주입합니다
//
// ★ 출처 표기 의무: 화면에 "공연 정보 출처: 공연예술통합전산망(KOPIS)" 를 노출합니다.
//   상업적 이용 조건은 예술경영지원센터 약관을 확인하세요.
//

import { createClient } from 'jsr:@supabase/supabase-js@2'

const KOPIS_BASE = 'http://www.kopis.or.kr/openApi/restful'
/** 11 = 서울특별시 */
const REGION = '11'
/** 오늘부터 며칠 뒤까지 수집할지 */
const DAYS_AHEAD = 30
/** 한 번에 가져올 목록 개수 (KOPIS 최대 100) */
const PAGE_SIZE = 100
/**
 * 목록을 몇 페이지까지 넘길지.
 *
 * ★ 전에는 cpage=1 로 고정돼 있어서 서울 30일치 수백 건 중 앞 100건만 들어왔고,
 *   매번 같은 100건만 갱신됐습니다. 그러면 "서울 공연을 보여준다"고 하기에
 *   표본이 너무 작습니다.
 *
 * ★ 상한을 두는 이유는 공연 1건마다 상세·공연장 API를 부르기 때문입니다.
 *   100건에 23초였습니다. 아래 SKIP(이미 받은 공연 건너뛰기)이 있어서 두 번째
 *   실행부터는 대부분 API 호출 없이 지나가고, 그만큼 더 멀리 볼 수 있습니다.
 */
const MAX_PAGES = 12
/**
 * 이 시간을 넘기면 중단하고 지금까지 넣은 것으로 끝냅니다.
 *
 * ★ Edge Function 은 무한히 돌지 않습니다. 시간이 다 돼서 런타임에 끊기면
 *   응답도 통계도 없이 사라져서, 어디까지 됐는지 알 수 없습니다. 스스로
 *   멈추고 stoppedEarly 를 돌려주면 다음 실행이 이어받습니다.
 */
const TIME_BUDGET_MS = 110_000
/** 시간 정보가 없을 때 쓰는 기본 시작 시각 (KST) */
const DEFAULT_HOUR = 19
const DEFAULT_MINUTE = 30

interface KopisShow {
  mt20id: string
  prfnm: string
  prfpdfrom: string
  prfpdto: string
  fcltynm: string
  genrenm: string
  poster: string
}

/**
 * KOPIS 응답은 중첩이 없는 단순 XML 입니다.
 * XML 파서를 하나 더 들이는 대신 태그를 직접 뽑습니다 — 의존성이 줄고,
 * 응답 형태가 바뀌면 조용히 잘못 파싱되는 대신 값이 비어 눈에 띕니다.
 */
function tagText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))
  return m ? m[1].trim() : ''
}

function splitItems(xml: string, tag = 'db'): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1])
}

function yyyymmdd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/**
 * timestamptz → KST 기준 'YYYY-MM-DD'.
 *
 * ★ toISOString() 은 UTC 라 한국 시각 오전 9시 전 공연이 하루 앞 날짜로 나옵니다.
 *   9시간을 더한 뒤 잘라야 KST 날짜가 됩니다.
 */
function kstDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 3_600_000).toISOString().slice(0, 10)
}

/** 'YYYY.MM.DD' → KST 기준 ISO. 시각 정보가 없으면 기본 시각을 씁니다 */
function toIsoKst(dateStr: string, hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE): string | null {
  const m = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (!m) return null
  const [, y, mo, d] = m
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${y}-${mo}-${d}T${hh}:${mm}:00+09:00`
}

/**
 * 공연 시간 안내 문자열에서 첫 시각만 뽑습니다.
 * 예: "화요일 ~ 금요일(19:30), 토요일(15:00,19:00)" → 19:30
 * 요일별 회차를 전부 행으로 만들지는 않습니다 — 정확한 회차는 원본 예매처에서
 * 확인하도록 링크를 걸고, 우리는 "이 기간에 이런 공연이 있다"만 보여줍니다.
 */
function firstTime(guidance: string): { hour: number; minute: number } | null {
  const m = guidance.match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return { hour: Number(m[1]), minute: Number(m[2]) }
}

/**
 * 'prfruntime' 은 "1시간", "2시간 30분", "100분" 같은 자유 문장입니다.
 * 못 읽으면 120분으로 둡니다 — 목록에서 "진행 중" 판정에만 쓰이는 값입니다.
 */
function parseRuntime(raw: string): number {
  const h = raw.match(/(\d+)\s*시간/)
  const m = raw.match(/(\d+)\s*분/)
  const total = (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0)
  return total > 0 ? total : 120
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    // ★ 상태 코드만 던지면 왜 400 인지 알 수 없습니다. KOPIS 는 실패 이유를
    //   본문에 적어 보내므로 앞부분을 같이 남깁니다. 키는 로그에 남지 않게
    //   URL 은 넣지 않습니다.
    const body = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200)
    throw new Error(`KOPIS 응답 오류 ${res.status}${body ? ` — ${body}` : ''}`)
  }
  return await res.text()
}

/** 잠깐 쉬기. KOPIS 가 연속 호출을 막는 경우가 있습니다 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 주소 → 좌표. 실패하면 null (그 공연은 건너뜁니다) */
async function geocode(address: string, kakaoKey: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${kakaoKey}` } },
  )
  if (!res.ok) return null
  const json = await res.json()
  const doc = json.documents?.[0]
  if (!doc) return null
  return { lat: Number(doc.y), lng: Number(doc.x) }
}

Deno.serve(async () => {
  const kopisKey = Deno.env.get('KOPIS_API_KEY')
  const kakaoKey = Deno.env.get('KAKAO_REST_API_KEY')
  if (!kopisKey) {
    return Response.json({ ok: false, error: 'KOPIS_API_KEY 시크릿이 없습니다' }, { status: 500 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const from = new Date()
  const to = new Date(Date.now() + DAYS_AHEAD * 86_400_000)

  const startedAt = Date.now()
  const stats = {
    pages: 0,
    fetched: 0,
    upserted: 0,
    /** 이미 같은 기간·시간 안내로 들어와 있어서 API 호출 없이 지나간 수 */
    skippedFresh: 0,
    skippedNoCoords: 0,
    failed: 0,
    /** 시간이 다 돼서 중간에 멈췄는지 */
    stoppedEarly: false,
    /** 목록 페이지를 넘기다 멈춘 이유 (없으면 끝까지 넘긴 것) */
    pageError: '',
  }
  /** 같은 공연장을 여러 번 지오코딩하지 않도록 */
  const coordCache = new Map<string, { lat: number; lng: number } | null>()

  try {
    // ── 목록: 마지막 페이지까지 ──
    //
    // ★ 한 페이지가 실패해도 앞 페이지에서 받은 것은 그대로 처리합니다.
    //   전에는 여기서 던진 예외가 바깥 catch 로 빠져서, 1페이지의 100건까지
    //   통째로 버리고 fetched: 0 으로 끝났습니다. 부분 성공이 전부 실패가
    //   되면 안 됩니다 — KOPIS 가 잠깐 400 을 주는 것만으로 지도가 빕니다.
    const items: KopisShow[] = []
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url =
        `${KOPIS_BASE}/pblprfr?service=${kopisKey}` +
        `&stdate=${yyyymmdd(from)}&eddate=${yyyymmdd(to)}` +
        `&cpage=${page}&rows=${PAGE_SIZE}&signgucode=${REGION}`

      let listXml: string
      try {
        listXml = await fetchText(url)
      } catch (e) {
        // 연속 호출을 막는 것일 수 있어 한 번만 쉬고 다시 시도합니다
        await sleep(1200)
        try {
          listXml = await fetchText(url)
        } catch (e2) {
          stats.pageError = `${page}페이지: ${e2 instanceof Error ? e2.message : e2}`
          break
        }
      }

      const chunk = splitItems(listXml).map((x) => ({
        mt20id: tagText(x, 'mt20id'),
        prfnm: tagText(x, 'prfnm'),
        prfpdfrom: tagText(x, 'prfpdfrom'),
        prfpdto: tagText(x, 'prfpdto'),
        fcltynm: tagText(x, 'fcltynm'),
        genrenm: tagText(x, 'genrenm'),
        poster: tagText(x, 'poster'),
      }))
      items.push(...chunk)
      stats.pages = page
      // 한 페이지가 덜 찼으면 마지막 페이지입니다
      if (chunk.length < PAGE_SIZE) break
      await sleep(400)
    }
    stats.fetched = items.length

    // ── 이미 들어와 있는 공연 ──
    //
    // ★ 공연 1건마다 상세·공연장 API를 두 번 부르는 것이 이 함수에서 가장 비싼
    //   일입니다. 기간도 그대로고 시간 안내도 이미 있으면 다시 물어볼 이유가
    //   없습니다. 이걸 건너뛰는 덕분에 페이지를 12장까지 볼 수 있습니다.
    const known = new Map<string, { from: string; to: string }>()
    {
      const { data } = await supabase
        .from('shows')
        .select('kopis_id,starts_at,run_ends_at,schedule_note')
        .eq('source', 'kopis')
        .not('schedule_note', 'is', null)
        .limit(5000)
      for (const r of data ?? []) {
        if (!r.kopis_id || !r.run_ends_at) continue
        known.set(r.kopis_id, { from: kstDate(r.starts_at), to: kstDate(r.run_ends_at) })
      }
    }

    for (const item of items) {
      // ★ 시간이 다 됐으면 여기서 멈춥니다. 런타임에 끊기면 통계도 못 남깁니다.
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        stats.stoppedEarly = true
        break
      }

      if (!item.mt20id) continue

      // 기간이 그대로고 시간 안내도 이미 있으면 다시 물어보지 않습니다
      const seen = known.get(item.mt20id)
      if (
        seen &&
        seen.from === item.prfpdfrom.replaceAll('.', '-') &&
        seen.to === item.prfpdto.replaceAll('.', '-')
      ) {
        stats.skippedFresh++
        continue
      }

      try {
        // 상세 — 공연시설 id 와 시간 안내를 얻습니다
        const detailXml = await fetchText(`${KOPIS_BASE}/pblprfr/${item.mt20id}?service=${kopisKey}`)
        const facilityId = tagText(detailXml, 'mt10id')
        const guidance = tagText(detailXml, 'dtguidance')
        const story = tagText(detailXml, 'sty')
        const runtime = parseRuntime(tagText(detailXml, 'prfruntime'))
        const priceNote = tagText(detailXml, 'pcseguidance')

        // 공연장 — 주소와 좌표
        let address = ''
        let coords: { lat: number; lng: number } | null = null
        if (facilityId) {
          if (coordCache.has(facilityId)) {
            coords = coordCache.get(facilityId) ?? null
          }
          const placeXml = await fetchText(`${KOPIS_BASE}/prfplc/${facilityId}?service=${kopisKey}`)
          address = tagText(placeXml, 'adres')
          const la = Number(tagText(placeXml, 'la'))
          const lo = Number(tagText(placeXml, 'lo'))
          if (Number.isFinite(la) && Number.isFinite(lo) && la !== 0 && lo !== 0) {
            coords = { lat: la, lng: lo }
          } else if (!coords && kakaoKey) {
            coords = await geocode(address, kakaoKey)
          }
          coordCache.set(facilityId, coords)
        }

        if (!coords) {
          stats.skippedNoCoords++
          continue
        }

        const t = firstTime(guidance)
        // ★ 원본 기간을 그대로 저장합니다.
        //
        //   예전에는 "시작일이 지났으면 오늘로 당긴다"고 했습니다. 두 가지가 잘못됐습니다.
        //   ① 위 정규식이 깨져 있어서(모든 문자를 바꿔 "----------") 시작일과 무관하게
        //      항상 오늘로 당겨졌습니다.
        //   ② 애초에 그 방식은 매일 동기화가 도는 것에 의존합니다. 크론이 하루
        //      실패하면 모든 공연이 과거가 되어 지도가 빕니다.
        //
        //   대학로 연극은 두 달을 공연합니다. 하루짜리 시각 하나로 표현하려 한 것이
        //   잘못이었고, 기간(run_ends_at)을 함께 저장하면 크론이 며칠 멈춰도
        //   목록이 비지 않습니다.
        const startsAt = toIsoKst(item.prfpdfrom, t?.hour, t?.minute)
        // 마지막 공연일 23:59 까지 목록에 남깁니다
        const runEndsAt = toIsoKst(item.prfpdto, 23, 59)
        if (!startsAt) {
          stats.failed++
          continue
        }

        const { error } = await supabase.from('shows').upsert(
          {
            source: 'kopis',
            kopis_id: item.mt20id,
            title: item.prfnm,
            description: story || `${item.genrenm} · ${item.prfpdfrom} ~ ${item.prfpdto}`,
            starts_at: startsAt,
            run_ends_at: runEndsAt,
            duration_min: runtime,
            capacity: 0,
            status: 'confirmed',
            external_url: `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_000020&mt20Id=${item.mt20id}`,
            poster_url: item.poster || null,
            price_note: priceNote || null,
            genre_raw: item.genrenm || null,
            // ★ 시간 안내 원문. 전에는 firstTime() 으로 첫 시각만 뽑고 버렸습니다.
            //   그 문장에 '무슨 요일에 공연하는지'가 들어 있는데, 그걸 버려서
            //   74일짜리 연극이 74일 내내 날짜 탭에 떴습니다.
            schedule_note: guidance || null,
            venue_name_raw: item.fcltynm,
            venue_addr_raw: address,
            lat: coords.lat,
            lng: coords.lng,
          },
          { onConflict: 'kopis_id' },
        )
        if (error) {
          stats.failed++
          console.error('upsert 실패', item.mt20id, error.message)
        } else {
          stats.upserted++
        }
      } catch (e) {
        stats.failed++
        console.error('공연 처리 실패', item.mt20id, e instanceof Error ? e.message : e)
      }
    }

    return Response.json({ ok: true, ...stats })
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), ...stats },
      { status: 500 },
    )
  }
})
