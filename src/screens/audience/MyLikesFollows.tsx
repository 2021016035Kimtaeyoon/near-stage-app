import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShowCard } from '@/components/cards/ShowCard'
import { PerformerCard } from '@/components/cards/PerformerCard'
import { withMeta } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

export function MyLikedShows() {
  const navigate = useNavigate()
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const toggleLike = useAppStore((s) => s.toggleLike)
  const nowIso = useAppStore((s) => s.demoNowIso)

  const liked = withMeta(
    shows.filter((s) => likedShowIds.includes(s.id)),
    venues,
    performers,
  )

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
          onToggleLike={() => toggleLike(item.show.id)}
          onClick={() => navigate(`/audience/show/${item.show.id}`)}
        />
      ))}
    </div>
  )
}

export function MyFollowedPerformers() {
  const navigate = useNavigate()
  const performers = useAppStore((s) => s.performers)
  const shows = useAppStore((s) => s.shows)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const nowIso = useAppStore((s) => s.demoNowIso)

  const followed = performers.filter((p) => followedPerformerIds.includes(p.id))

  if (followed.length === 0) {
    return (
      <EmptyState
        art="chat"
        title="팔로우한 팀이 없어요"
        description="클립 피드에서 마음에 드는 팀을 팔로우해보세요."
        action={
          <button
            onClick={() => navigate('/audience/clips')}
            className="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white"
          >
            클립 피드 보기
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {followed.map((performer) => {
        const now = new Date(nowIso).getTime()
        const nextShow = shows
          .filter((s) => s.performerId === performer.id && new Date(s.startAt).getTime() > now)
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0]
        return (
          <PerformerCard
            key={performer.id}
            performer={performer}
            onClick={() => (nextShow ? navigate(`/audience/show/${nextShow.id}`) : navigate('/audience/clips'))}
            footer={
              <p className="text-2xs text-ink-3">
                {nextShow ? '다가오는 공연이 있어요 · 탭해서 보기' : '다가오는 공연 일정이 아직 없어요'}
              </p>
            }
          />
        )
      })}
    </div>
  )
}
