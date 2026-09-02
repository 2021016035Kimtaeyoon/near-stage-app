import { Crown, Gem, Sprout, Star, type LucideIcon } from 'lucide-react'
import { computeAudiencePoints, getMembershipStatus } from '@/lib/membership'
import { useAppStore } from '@/store/useAppStore'

const TIER_ICON: Record<string, LucideIcon> = {
  sprout: Sprout,
  regular: Star,
  vip: Gem,
  headliner: Crown,
}

/** 실제 예약·리뷰·좋아요·팔로우 데이터로만 계산되는 회원등급 카드 */
export function MembershipCard() {
  const reservations = useAppStore((s) => s.reservations)
  const reviews = useAppStore((s) => s.reviews)
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)

  const points = computeAudiencePoints(reservations, reviews, likedShowIds, followedPerformerIds)
  const status = getMembershipStatus(points)
  const Icon = TIER_ICON[status.tier.key] ?? Star

  return (
    <div className="card-elevated mb-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500/15">
          <Icon size={20} className="text-gold-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold">{status.tier.label}</p>
          <p className="tnum mt-0.5 text-2xs text-ink-3">{points.toLocaleString('ko-KR')}P 보유</p>
        </div>
        <span className="tnum shrink-0 text-2xs font-bold text-ink-2">
          {status.next ? `${status.next.label}까지 ${status.remaining}P` : '최고 등급'}
        </span>
      </div>

      <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="bg-gold-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${status.progressPct}%` }}
        />
      </div>

      <p className="mt-3 text-2xs leading-snug text-ink-3">
        <span className="font-bold text-ink-2">이번 등급 혜택</span> · {status.tier.perk}
      </p>
    </div>
  )
}
