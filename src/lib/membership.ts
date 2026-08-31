import { DEMO_AUDIENCE_NAME } from '@/config/brand'
import type { Reservation, Review } from '@/types'

/**
 * 회원등급 포인트는 실제 store 데이터(예약·리뷰·좋아요·팔로우)에서만 계산합니다 —
 * 별도의 포인트 원장을 두지 않아, 예약/리뷰 화면에서 실제로 행동한 만큼만 오릅니다.
 */
export function computeAudiencePoints(
  reservations: Reservation[],
  reviews: Review[],
  likedShowIds: string[],
  followedPerformerIds: string[],
): number {
  const myReviews = reviews.filter((r) => r.authorName === DEMO_AUDIENCE_NAME)
  const attended = reservations.filter((r) => r.status === '입장완료').length
  const booked = reservations.filter((r) => r.status === '예약').length
  return attended * 60 + booked * 20 + myReviews.length * 30 + likedShowIds.length * 5 + followedPerformerIds.length * 10
}

export interface MembershipTier {
  key: string
  label: string
  minPoints: number
  perk: string
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  { key: 'sprout', label: '새싹 관객', minPoints: 0, perk: '무대 지도 자유 이용' },
  { key: 'regular', label: '단골 관객', minPoints: 100, perk: '예약 확정 알림 우선 발송' },
  { key: 'vip', label: 'VIP 관객', minPoints: 250, perk: '예약금 면제 쿠폰 매달 1장' },
  { key: 'headliner', label: '헤드라이너 관객', minPoints: 500, perk: '신규 공연 얼리 액세스 + 전용 배지' },
]

export interface MembershipStatus {
  points: number
  tier: MembershipTier
  next: MembershipTier | null
  /** 다음 등급까지 진행률 0~100 (최고 등급이면 100) */
  progressPct: number
  /** 다음 등급까지 남은 포인트 (최고 등급이면 0) */
  remaining: number
}

export function getMembershipStatus(points: number): MembershipStatus {
  let tier = MEMBERSHIP_TIERS[0]
  for (const t of MEMBERSHIP_TIERS) {
    if (points >= t.minPoints) tier = t
  }
  const idx = MEMBERSHIP_TIERS.indexOf(tier)
  const next = MEMBERSHIP_TIERS[idx + 1] ?? null

  if (!next) return { points, tier, next: null, progressPct: 100, remaining: 0 }

  const span = next.minPoints - tier.minPoints
  const gained = points - tier.minPoints
  return {
    points,
    tier,
    next,
    progressPct: Math.max(0, Math.min(100, Math.round((gained / span) * 100))),
    remaining: next.minPoints - points,
  }
}
