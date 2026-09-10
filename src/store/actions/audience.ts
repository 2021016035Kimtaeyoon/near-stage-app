import type { AudienceFilter } from '@/types'
import type { SetState } from '../types'

/**
 * 관객 화면의 UI 전용 상태.
 *
 * ★ 여기 있던 좋아요·팔로우·참석예정·리뷰 액션은 전부 DB 로 옮겨갔습니다
 *   (hooks/useEngagement.ts, hooks/useReviews.ts). 그 액션들이 건드리던
 *   likedShowIds/followedPerformerIds/shows/reservations/reviews 는 이제
 *   어떤 화면도 읽지 않는 값이었습니다 — 지웠습니다.
 *
 *   남은 두 가지는 서버에 저장할 필요가 없는 진짜 UI 상태입니다: 지금 화면
 *   필터, 그리고 이 브라우저 세션에서 방금 뭘 봤는지.
 */
export function createAudienceActions(set: SetState) {
  return {
    setAudienceFilter: (patch: Partial<AudienceFilter>) =>
      set((s) => ({ audienceFilter: { ...s.audienceFilter, ...patch } })),

    addRecentlyViewedShow: (showId: string) =>
      set((s) => ({
        recentlyViewedShowIds: [
          showId,
          ...s.recentlyViewedShowIds.filter((id) => id !== showId),
        ].slice(0, 10),
      })),
  }
}
