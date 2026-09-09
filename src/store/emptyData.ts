import type {
  AppNotification,
  ChatMessage,
  ChatThread,
  Performer,
  Post,
  Reservation,
  Review,
  ReverseBid,

  Show,
  Venue,
  WeeklyVisitStat,
} from '@/types'

/**
 * 애플리케이션 데이터의 형태.
 *
 * 예전에는 `src/data/seed/` 의 목데이터로 이 자리를 채웠지만, 이제 원천은 DB입니다.
 * 이 모듈은 "아직 아무것도 불러오지 않은 상태"의 빈 값만 정의합니다.
 * 화면은 여기 담긴 값이 아니라 `src/hooks/use*.ts` 의 데이터 훅에서 읽어야 합니다.
 */
export interface AppData {
  venues: Venue[]
  performers: Performer[]
  shows: Show[]
  posts: Post[]
  reverseBids: ReverseBid[]
  reservations: Reservation[]
  reviews: Review[]
  notifications: AppNotification[]
  chatThreads: ChatThread[]
  chatMessages: ChatMessage[]
  weeklyStats: WeeklyVisitStat[]
  likedShowIds: string[]
  followedPerformerIds: string[]
  recentlyViewedShowIds: string[]
}

/** 매 호출마다 새 배열을 돌려줍니다 (리셋 시 이전 배열을 공유하지 않도록) */
export function createEmptyData(): AppData {
  return {
    venues: [],
    performers: [],
    shows: [],
    posts: [],
    reverseBids: [],
    reservations: [],
    reviews: [],
    notifications: [],
    chatThreads: [],
    chatMessages: [],
    weeklyStats: [],
    likedShowIds: [],
    followedPerformerIds: [],
    recentlyViewedShowIds: [],
  }
}
