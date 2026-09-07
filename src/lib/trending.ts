import type { ShowWithMeta } from '@/store/selectors'

export interface TrendingKeyword {
  rank: number
  term: string
  /** 상위 3위 안에 든 급상승 키워드 표시용 */
  hot: boolean
}

/**
 * 실시간 인기 검색어 — 팀명·장르·동네를 하나의 인기 점수로 합산해 랭킹을 매깁니다.
 * 별도 서버 없이, 현재 스토어에 있는 좋아요·팔로워·예약 수치로만 계산하므로
 * 공연이 새로 확정되거나 좋아요가 늘면 즉시 순위에 반영됩니다.
 */
export function computeTrendingKeywords(items: ShowWithMeta[], limit = 10): TrendingKeyword[] {
  const score = new Map<string, number>()
  const bump = (term: string, amount: number) => {
    if (!term) return
    score.set(term, (score.get(term) ?? 0) + amount)
  }

  for (const { show, place, performer } of items) {
    if (show.genre) bump(show.genre, show.likes * 2 + show.reservedCount)
    bump(place.district, show.likes + show.reservedCount * 0.5)
    if (performer) {
      bump(performer.teamName, show.likes * 3 + performer.followerCount * 0.04)
    }
  }

  return Array.from(score.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term], i) => ({ rank: i + 1, term, hot: i < 3 }))
}
