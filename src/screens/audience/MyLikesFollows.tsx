import { useNavigate } from 'react-router-dom'
import { ShowCard } from '@/components/cards/ShowCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyFollows, useMyLikes } from '@/hooks/useEngagement'
import { usePublicShows } from '@/hooks/usePublicShows'
import { useNow } from '@/store/useAppStore'

/**
 * 좋아요 · 팔로우 목록 (§12).
 *
 * ★ 둘 다 본인 행만 읽힙니다(RLS). 남이 무엇을 좋아하는지, 누구를 따라다니는지
 *   알 수 없어야 합니다.
 */
export function MyLikedShows() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const likes = useMyLikes()
  const shows = usePublicShows()

  if (!userId) {
    return (
      <EmptyState
        art="search"
        title="로그인하면 좋아요한 공연을 볼 수 있어요"
        description="지도에서 마음에 드는 공연에 하트를 눌러보세요."
      />
    )
  }

  if (likes.loading || shows.loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    )
  }

  const liked = shows.data.filter((x) => likes.data.includes(x.show.id))

  if (liked.length === 0) {
    return (
      <EmptyState
        art="search"
        title="좋아요한 공연이 없어요"
        description="지도에서 마음에 드는 공연에 하트를 눌러보세요."
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {liked.map((item) => (
        <ShowCard
          key={item.show.id}
          item={item}
          nowIso={nowIso}
          liked
          onClick={() => navigate(`/audience/show/${item.show.id}`)}
          onToggleLike={() => void likes.toggle(item.show.id)}
        />
      ))}
    </div>
  )
}

/**
 * 팔로우한 팀.
 *
 * 팀 정보는 공연 목록(v_public_shows)에 함께 실려 옵니다. 팀만 따로 읽는 경로를
 * 하나 더 만드는 대신, 이미 받아온 데이터에서 추립니다 — 팔로우했는데 공연이
 * 하나도 없는 팀은 이름만이라도 보여줘야 해서 그 경우는 따로 표시합니다.
 */
export function MyFollowedPerformers() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const follows = useMyFollows()
  const shows = usePublicShows()

  if (!userId) {
    return (
      <EmptyState
        art="search"
        title="로그인하면 팔로우한 팀을 볼 수 있어요"
        description="공연 화면에서 팀을 팔로우하면 새 공연이 열릴 때 알림이 갑니다."
      />
    )
  }

  if (follows.loading || shows.loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    )
  }

  if (follows.data.length === 0) {
    return (
      <EmptyState
        art="search"
        title="팔로우한 팀이 없어요"
        description="공연 화면에서 팀을 팔로우하면 새 공연이 열릴 때 알림이 갑니다."
      />
    )
  }

  const upcoming = shows.data.filter(
    (x) => x.performer && follows.data.includes(x.performer.id),
  )

  if (upcoming.length === 0) {
    return (
      <EmptyState
        art="stage"
        title={`팔로우한 팀 ${follows.data.length}팀`}
        description="지금 예정된 공연이 없습니다. 새 공연이 열리면 알림으로 알려드릴게요."
      />
    )
  }

  return (
    <div>
      <p className="mb-2.5 text-2xs text-ink-3">
        팔로우한 팀의 다가오는 공연 {upcoming.length}건
      </p>
      <div className="space-y-2.5">
        {upcoming.map((item) => (
          <ShowCard
            key={item.show.id}
            item={item}
            nowIso={nowIso}
            onClick={() => navigate(`/audience/show/${item.show.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
