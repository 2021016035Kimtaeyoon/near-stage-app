import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 앱 전체의 "지금"은 실제 시스템 시각이 아니라 store의 demoNowIso 입니다.
 * 이 모듈은 그 값을 인자로 받아 동작하는 순수 함수만 제공합니다.
 */

export const KST_OFFSET = '+09:00'

export function toDate(iso: string): Date {
  return new Date(iso)
}

/** 'YYYY-MM-DDTHH:mm:00+09:00' 문자열 만들기 */
export function kstIso(y: number, m: number, d: number, hh: number, mm = 0): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${y}-${p(m)}-${p(d)}T${p(hh)}:${p(mm)}:00${KST_OFFSET}`
}

export function fmt(iso: string, pattern: string): string {
  return format(new Date(iso), pattern, { locale: ko })
}

/** '오늘 21:30' / '내일 20:00' / '9/8(화) 19:00' */
export function humanDateTime(iso: string, nowIso: string): string {
  const d = new Date(iso)
  const now = new Date(nowIso)
  if (isSameDay(d, now)) return `오늘 ${format(d, 'HH:mm')}`
  if (isSameDay(d, addDays(now, 1))) return `내일 ${format(d, 'HH:mm')}`
  if (isSameDay(d, addDays(now, -1))) return `어제 ${format(d, 'HH:mm')}`
  return format(d, 'M/d(EEE) HH:mm', { locale: ko })
}

export function humanDate(iso: string, nowIso: string): string {
  const d = new Date(iso)
  const now = new Date(nowIso)
  if (isSameDay(d, now)) return '오늘'
  if (isSameDay(d, addDays(now, 1))) return '내일'
  return format(d, 'M월 d일(EEE)', { locale: ko })
}

/** '3분 전' / '2시간 전' / '3일 전' */
export function relativeFromNow(iso: string, nowIso: string): string {
  const mins = differenceInMinutes(new Date(nowIso), new Date(iso))
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return format(new Date(iso), 'M월 d일', { locale: ko })
}

/** 공연 시작까지 남은 시간 라벨. 이미 시작했으면 '진행 중' */
export function countdownLabel(startIso: string, nowIso: string, durationMin: number): string {
  const start = new Date(startIso).getTime()
  const now = new Date(nowIso).getTime()
  const diffMin = Math.round((start - now) / 60000)
  if (diffMin <= 0 && now < start + durationMin * 60000) return '진행 중'
  if (diffMin <= 0) return '종료'
  if (diffMin < 60) return `${diffMin}분 후 시작`
  const hours = Math.floor(diffMin / 60)
  if (hours < 24) return `${hours}시간 후 시작`
  return `${Math.floor(hours / 24)}일 후`
}

/**
 * "오늘 밤" 범위 — 기준 시각이 속한 날의 17:00 부터 다음날 04:00 까지.
 * 새벽에 열어도 그 전날 밤 공연을 보여주기 위해, 04:00 이전이면 전날 밤으로 봅니다.
 */
export function tonightRange(nowIso: string): { from: number; to: number } {
  const now = new Date(nowIso)
  const anchor = now.getHours() < 4 ? addDays(now, -1) : now
  const base = startOfDay(anchor)
  const from = new Date(base)
  from.setHours(17, 0, 0, 0)
  const to = addDays(new Date(base), 1)
  to.setHours(4, 0, 0, 0)
  return { from: from.getTime(), to: to.getTime() }
}

/** "주말" 범위 — 기준 시각 이후 가장 가까운 금 18:00 ~ 일 24:00 */
export function weekendRange(nowIso: string): { from: number; to: number } {
  const now = new Date(nowIso)
  const dow = now.getDay() // 0=일
  // 이번 주 금요일까지 남은 일수 (금=5). 토·일이면 이미 주말 안.
  let toFriday = (5 - dow + 7) % 7
  if (dow === 0 || dow === 6) toFriday = dow === 6 ? -1 : -2
  const friday = startOfDay(addDays(now, toFriday))
  const from = new Date(friday)
  from.setHours(18, 0, 0, 0)
  const to = addDays(startOfDay(friday), 3) // 월요일 00:00
  return { from: from.getTime(), to: to.getTime() }
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function weekdayLabel(w: number): string {
  return WEEKDAY_LABELS[w] ?? ''
}

/** 'HH:mm' → 분 */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

export function minToHm(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** 원 단위 금액 표기 */
export function won(n: number): string {
  return n.toLocaleString('ko-KR')
}

export function priceLabel(n: number): string {
  return n === 0 ? '무료' : `${won(n)}원`
}

/**
 * 공연의 가격 표기.
 *
 * ★ 등록 공연(KOPIS)에 priceLabel(0) 을 쓰면 3만원짜리 공연이 "무료"로 표시됩니다.
 *   우리 스키마에는 가격 숫자 컬럼이 없고(플랫폼이 대금에 관여하지 않으므로),
 *   등록 공연은 원본이 준 안내 문장을 그대로 보여주는 것이 유일하게 정확합니다.
 */
export function showPriceLabel(source: 'own' | 'kopis', priceNote?: string): string {
  if (source === 'kopis') return priceNote?.trim() || '예매처에서 확인'
  // 우리 무대는 플랫폼을 통한 결제가 없습니다. 티켓이 있으면 현장에서 냅니다.
  return '참가비 없음'
}

/**
 * 공연이 끝났는지.
 *
 * ★ 판단이 화면 10곳에 흩어져 있었고, 전부 `startAt + durationMin` 만 봤습니다.
 *   등록 공연(KOPIS)은 대학로 연극처럼 두 달을 공연하는 경우가 있어서, 시작 시각
 *   하나로 보면 첫날이 지난 순간 전부 "끝난 공연"이 되어 지도에서 사라집니다.
 *   실제로 등록 공연 100건이 그렇게 사라져 있었습니다.
 *
 *   공연 기간(runEndsAt)이 있으면 그걸 우선합니다.
 */
export function showEndMs(show: {
  startAt: string
  durationMin: number
  runEndsAt?: string | null
}): number {
  if (show.runEndsAt) return new Date(show.runEndsAt).getTime()
  return new Date(show.startAt).getTime() + show.durationMin * 60_000
}

export function isShowOver(
  show: { startAt: string; durationMin: number; runEndsAt?: string | null },
  nowIso: string,
): boolean {
  return showEndMs(show) < new Date(nowIso).getTime()
}
