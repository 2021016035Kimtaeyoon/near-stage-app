/**
 * 등록 공연의 "무슨 날 하는지" 판정.
 *
 * ★ KOPIS 가 주는 것은 공연 '기간'(9월 1일 ~ 11월 30일)이지 '무슨 요일에 하는지'가
 *   아닙니다. 기간만 보고 거르면 74일짜리 연극이 74일 내내 날짜 탭에 뜹니다.
 *   요일은 상세 API 의 dtguidance 에 사람이 읽는 문장으로 들어 있습니다:
 *     '화요일 ~ 금요일(20:00), 토요일(15:00,19:00), 일요일(15:00)'
 *     '2026.09.16(수) 15:30, 2026.09.17(목) 19:30'
 *
 * ★ 읽어내지 못하면 null 을 돌려줍니다. 그때는 거르지 않고 화면에 "예매처에서
 *   확인하세요"라고 밝힙니다. 못 읽은 문장을 아무 요일로나 찍으면 관객이 공연
 *   없는 날 가게 됩니다 — 장비 조건(needMatch)에서 쓴 것과 같은 원칙입니다.
 */

/** 일요일이 0 입니다 (Date.getDay 와 같게) */
const DAY_INDEX: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 }

/** 이 말이 들어 있는 조각은 공연하는 날이 아니라 쉬는 날입니다 */
const NEGATIVE = /휴관|휴무|휴연|휴일\s*휴|쉼|없음|제외|미공연/

export type ShowSchedule =
  /** 공연하는 날짜가 문장에 그대로 적힌 경우 ('YYYY-MM-DD') */
  | { kind: 'dates'; dates: string[] }
  /** 요일로 적힌 경우 (0=일 … 6=토) */
  | { kind: 'weekdays'; days: number[] }

/**
 * 시간 안내 문장에서 공연일을 읽어냅니다. 못 읽으면 null.
 */
export function parseSchedule(note: string | null | undefined): ShowSchedule | null {
  if (!note) return null
  const text = note.trim()
  if (!text) return null

  // ── ① 날짜가 직접 적힌 형태가 우선입니다. 요일보다 정확합니다 ──
  const dates = [...text.matchAll(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/g)].map(
    (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
  )
  if (dates.length > 0) {
    return { kind: 'dates', dates: [...new Set(dates)] }
  }

  // ── ② 요일 ──
  //
  // 괄호 안은 공연 시각('20:00,19:00')이라 쉼표로 자르기 전에 걷어냅니다.
  // 안 걷어내면 '토요일(15:00,19:00)' 이 두 조각으로 갈라집니다.
  const stripped = text.replace(/\([^)]*\)/g, ' ')

  const days = new Set<number>()
  for (const seg of stripped.split(',')) {
    const t = seg.trim()
    // ★ '월요일 휴관' 을 공연일로 세면 안 됩니다. 안 거르면 화~일 공연에
    //   월요일이 붙어 7일이 되고, 그러면 아무것도 좁히지 못합니다.
    if (NEGATIVE.test(t)) continue

    // '화요일 ~ 금요일' 처럼 범위로 적힌 것
    const range = t.match(/([월화수목금토일])\s*요일?\s*[~–—-]\s*([월화수목금토일])\s*요일?/)
    if (range) {
      const from = DAY_INDEX[range[1]]
      const to = DAY_INDEX[range[2]]
      // 토~일 처럼 주를 넘어가는 범위가 있어서 7로 돌립니다
      for (let i = 0; i <= (to - from + 7) % 7; i++) days.add((from + i) % 7)
      continue
    }

    // ★ '월, 화, 수요일' 은 쉼표로 잘리면서 앞의 '월'·'화' 가 '요일' 을 잃습니다.
    //   그걸 못 세면 공연이 있는 날인데 목록에서 빠집니다 — 거짓 음성은
    //   못 읽은 것보다 나쁩니다. 홀로 남은 요일 글자를 살립니다.
    if (/^[월화수목금토일]$/.test(t)) {
      days.add(DAY_INDEX[t])
      continue
    }

    // '월·화·수요일' 처럼 가운뎃점으로 이어 쓴 것
    const chain = t.match(/((?:[월화수목금토일]\s*[·/]\s*)+[월화수목금토일])\s*요일/)
    if (chain) {
      for (const ch of chain[1]) if (ch in DAY_INDEX) days.add(DAY_INDEX[ch])
      continue
    }

    // ★ '요일' 이 붙은 것만 셉니다. 그냥 글자를 주우면 '공휴일' 의 '일' 을
    //   일요일로 읽습니다.
    for (const m of t.matchAll(/([월화수목금토일])\s*요일/g)) days.add(DAY_INDEX[m[1]])
  }

  if (days.size === 0) return null
  // ★ 7일 전부면 아무것도 좁히지 못합니다. 판정했다고 말할 이유가 없습니다.
  if (days.size === 7) return null
  return { kind: 'weekdays', days: [...days].sort() }
}

/**
 * 그 날에 공연이 있는지.
 *
 * true = 있음, false = 없음, **null = 우리가 모름**.
 * null 을 false 로 뭉개면 알 수 없는 공연이 목록에서 조용히 사라집니다.
 */
export function runsOnDate(
  schedule: ShowSchedule | null,
  dateKey: string,
): boolean | null {
  if (!schedule) return null
  if (schedule.kind === 'dates') return schedule.dates.includes(dateKey)
  const [y, m, d] = dateKey.split('-').map(Number)
  return schedule.days.includes(new Date(y, m - 1, d).getDay())
}

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const

/** '화·수·목·금 공연' 처럼 짧게. 못 읽었으면 null */
export function scheduleSummary(schedule: ShowSchedule | null): string | null {
  if (!schedule) return null
  if (schedule.kind === 'dates') {
    if (schedule.dates.length > 4) return `${schedule.dates.length}일 공연`
    return schedule.dates
      .map((d) => {
        const [, m, dd] = d.split('-')
        return `${Number(m)}.${Number(dd)}`
      })
      .join(' · ')
  }
  return `${schedule.days.map((d) => DAY_LABEL[d]).join('·')} 공연`
}

/**
 * 같은 문장을 몇 번이고 다시 파싱하지 않도록 기억해 둡니다.
 *
 * ★ 날짜 스트립은 21일 × 공연 100건을 매 렌더마다 훑습니다. 캐시가 없으면
 *   정규식 2100번이 스크롤할 때마다 돕니다. 문장은 100개도 안 되므로
 *   Map 하나로 끝납니다.
 */
const cache = new Map<string, ShowSchedule | null>()

export function scheduleOf(note: string | null | undefined): ShowSchedule | null {
  if (!note) return null
  const hit = cache.get(note)
  if (hit !== undefined) return hit
  const parsed = parseSchedule(note)
  cache.set(note, parsed)
  return parsed
}

/** 하루를 밀리초로 */
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 그 기간 안에 공연하는 날이 하나라도 있는지.
 *
 * true = 있음, false = 없음, **null = 모름**(거르지 말 것).
 *
 * ★ '오늘 밤'이나 고른 날짜는 하루지만 '주말'은 이틀입니다. 이틀 중 하루라도
 *   공연이 있으면 보여줘야 합니다.
 */
export function runsInRange(
  note: string | null | undefined,
  from: number,
  to: number,
): boolean | null {
  const schedule = scheduleOf(note)
  if (!schedule) return null

  // 기간의 시작 날짜부터 하루씩. 필터 기간은 길어도 며칠이라 안전합니다.
  const start = new Date(from)
  const first = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  for (let t = first; t <= to; t += DAY_MS) {
    const d = new Date(t)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
    if (runsOnDate(schedule, key)) return true
  }
  return false
}
