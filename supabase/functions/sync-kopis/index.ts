/**
 * KOPIS(공연예술통합전산망) 공연 정보 수집 — Supabase Edge Function.
 *
 * 왜 Edge Function 인가
 *  - KOPIS API 키가 프론트에 노출되면 안 됩니다. 브라우저에서 직접 부르면 키가 그대로
 *    번들에 박힙니다. 그래서 서버에서만 부르고, 키는 Supabase 시크릿에 둡니다.
 *  - shows 테이블에는 INSERT 정책이 없습니다(0003_rls.sql). service_role 로 실행되는
 *    이 함수만 source='kopis' 행을 넣을 수 있습니다.
 *
 * 무엇을 넣는가
 *  - 서울(signgucode=11) 공연만. 지역을 넓히려면 REGION 을 바꾸세요.
 *  - kopis_id(mt20id) 로 중복을 막습니다. 매일 돌려도 같은 공연이 늘어나지 않습니다.
 *  - 좌표가 없으면 카카오 로컬 API로 주소를 좌표로 바꿔 저장합니다. 좌표가 없으면
 *    지도에 찍을 수 없어 목록에서도 빠지므로, 지오코딩에 실패한 공연은 건너뜁니다.
 *
 * 필요한 시크릿 (supabase secrets set)
 *  - KOPIS_API_KEY      : 예술경영지원센터에서 발급
 *  - KAKAO_REST_API_KEY : 주소→좌표 변환용
 *  - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 런타임이 자동 주입합니다
 *
 * ★ 출처 표기 의무: 화면에 "공연 정보 출처: 공연예술통합전산망(KOPIS)" 를 노출합니다.
 *   상업적 이용 조건은 예술경영지원센터 약관을 확인하세요.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const KOPIS_BASE = 'http://www.kopis.or.kr/openApi/restful'
/** 11 = 서울특별시 */
const REGION = '11'
/** 오늘부터 며칠 뒤까지 수집할지 */
const DAYS_AHEAD = 30
/** 한 번에 가져올 목록 개수 (KOPIS 최대 100) */
const PAGE_SIZE = 100
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
  if (!res.ok) throw new Error(`KOPIS 응답 오류 ${res.status}`)
  return await res.text()
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

  const stats = { fetched: 0, upserted: 0, skippedNoCoords: 0, failed: 0 }
  /** 같은 공연장을 여러 번 지오코딩하지 않도록 */
  const coordCache = new Map<string, { lat: number; lng: number } | null>()

  try {
    const listXml = await fetchText(
      `${KOPIS_BASE}/pblprfr?service=${kopisKey}` +
        `&stdate=${yyyymmdd(from)}&eddate=${yyyymmdd(to)}` +
        `&cpage=1&rows=${PAGE_SIZE}&signgucode=${REGION}`,
    )

    const items: KopisShow[] = splitItems(listXml).map((x) => ({
      mt20id: tagText(x, 'mt20id'),
      prfnm: tagText(x, 'prfnm'),
      prfpdfrom: tagText(x, 'prfpdfrom'),
      prfpdto: tagText(x, 'prfpdto'),
      fcltynm: tagText(x, 'fcltynm'),
      genrenm: tagText(x, 'genrenm'),
      poster: tagText(x, 'poster'),
    }))
    stats.fetched = items.length

    for (const item of items) {
      if (!item.mt20id) continue
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
