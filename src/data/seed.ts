/**
 * 목데이터 단일 진입점.
 *
 * 화면 코드는 반드시 이 파일에서만 목데이터를 가져옵니다.
 * (실제 데이터 정의는 300줄 제한 때문에 ./seed/ 하위 모듈로 나눠 두었고,
 *  여기서 하나로 합쳐 노출합니다. 목데이터를 고치려면 ./seed/ 안의 파일만 보면 됩니다.)
 */
import type {
  AppNotification,
  Application,
  ChatMessage,
  ChatThread,
  Performer,
  Post,
  Reservation,
  ReverseBid,
  Review,
  Settlement,
  Show,
  Venue,
  WeeklyVisitStat,
} from '@/types'

import { SEED_WEEKLY_STATS } from './seed/analytics'
import { SEED_PERFORMERS } from './seed/performers'
import { SEED_POSTS, SEED_REVERSE_BIDS } from './seed/posts'
import {
  SEED_FOLLOWED_PERFORMER_IDS,
  SEED_LIKED_SHOW_IDS,
  SEED_RESERVATIONS,
} from './seed/reservations'
import { SEED_REVIEWS } from './seed/reviews'
import {
  SEED_CHAT_MESSAGES,
  SEED_CHAT_THREADS,
  SEED_NOTIFICATIONS,
  SEED_SETTLEMENTS,
} from './seed/social'
import { SEED_SHOWS } from './seed/shows'
import { SEED_VENUES } from './seed/venues'

export interface SeedData {
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
  settlements: Settlement[]
  weeklyStats: WeeklyVisitStat[]
  likedShowIds: string[]
  followedPerformerIds: string[]
}

/** 매 호출마다 깊은 복사본을 돌려줍니다 (리셋 시 원본 오염 방지) */
export function createSeedData(): SeedData {
  return structuredClone({
    venues: SEED_VENUES,
    performers: SEED_PERFORMERS,
    shows: SEED_SHOWS,
    posts: SEED_POSTS,
    reverseBids: SEED_REVERSE_BIDS,
    reservations: SEED_RESERVATIONS,
    reviews: SEED_REVIEWS,
    notifications: SEED_NOTIFICATIONS,
    chatThreads: SEED_CHAT_THREADS,
    chatMessages: SEED_CHAT_MESSAGES,
    settlements: SEED_SETTLEMENTS,
    weeklyStats: SEED_WEEKLY_STATS,
    likedShowIds: SEED_LIKED_SHOW_IDS,
    followedPerformerIds: SEED_FOLLOWED_PERFORMER_IDS,
  })
}

/** 모든 지원서를 평평하게 (구인글에 중첩되어 있으므로) */
export function flattenApplications(posts: Post[]): Application[] {
  return posts.flatMap((p) => p.applications)
}

export {
  SEED_VENUES,
  SEED_PERFORMERS,
  SEED_SHOWS,
  SEED_POSTS,
  SEED_REVERSE_BIDS,
  SEED_REVIEWS,
  SEED_NOTIFICATIONS,
  SEED_SETTLEMENTS,
  SEED_WEEKLY_STATS,
}
