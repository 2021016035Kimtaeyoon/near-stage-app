import { DEMO_NOW_ISO } from '@/config/brand'
import { makeRng } from '@/lib/rng'
import type { WeeklyVisitStat } from '@/types'
import { SEED_VENUES } from './venues'

/**
 * 성과 리포트용 데이터 — 공간별 최근 8주 주간 방문객 수.
 * 각 주가 "공연이 있던 주"인지 플래그(hadShow)를 함께 저장하고,
 * 대시보드 차트에서 두 그룹의 평균을 비교합니다.
 */

const WEEKS = 8

/** 공간별 8주 공연 유무 패턴 (true = 그 주에 공연이 있었음) */
const SHOW_PATTERN: Record<string, boolean[]> = {
  v1: [false, true, false, true, true, false, true, true],
  v2: [true, false, true, true, false, true, true, true],
  v3: [false, false, true, false, true, false, true, false],
  v4: [true, true, false, true, true, true, false, true],
  v5: [true, false, true, true, true, false, true, true],
  v6: [false, true, false, false, true, false, true, false],
  v7: [false, true, true, false, true, true, false, true],
  v8: [true, true, true, false, true, true, true, false],
  v9: [true, true, false, true, true, true, true, true],
  v10: [false, true, false, true, false, true, false, true],
  v11: [false, false, true, false, true, false, false, true],
  v12: [true, false, true, false, true, true, false, true],
  v13: [true, true, true, true, false, true, true, true],
  v14: [false, true, true, false, true, true, true, false],
  v15: [true, false, true, true, false, true, true, false],
  v16: [false, true, false, true, true, false, true, true],
}

function weekStart(index: number): string {
  // index 0 = 7주 전, index 7 = 이번 주
  const now = new Date(DEMO_NOW_ISO)
  const day = now.getDay() // 0=일
  const thisWeekMonday = new Date(now)
  thisWeekMonday.setDate(now.getDate() - ((day + 6) % 7))
  thisWeekMonday.setHours(0, 0, 0, 0)
  const d = new Date(thisWeekMonday)
  d.setDate(thisWeekMonday.getDate() - (WEEKS - 1 - index) * 7)
  return d.toISOString()
}

function weekLabel(index: number): string {
  const back = WEEKS - 1 - index
  if (back === 0) return '이번 주'
  return `${back}주 전`
}

const stats: WeeklyVisitStat[] = []

for (const venue of SEED_VENUES) {
  const pattern = SHOW_PATTERN[venue.id] ?? []
  // 규모에 비례한 주간 기본 방문객
  const base = Math.round(venue.capacity * 6.2 + 40)
  for (let i = 0; i < WEEKS; i++) {
    const rng = makeRng(`visits-${venue.id}-${i}`)
    const hadShow = pattern[i] ?? false
    const factor = hadShow ? 1.3 + rng() * 0.16 : 0.93 + rng() * 0.13
    stats.push({
      venueId: venue.id,
      weekLabel: weekLabel(i),
      weekStartIso: weekStart(i),
      visitors: Math.round(base * factor),
      hadShow,
    })
  }
}

export const SEED_WEEKLY_STATS: WeeklyVisitStat[] = stats
