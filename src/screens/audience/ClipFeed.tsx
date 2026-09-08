import { ChevronUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportSheet } from '@/components/ui/ReportSheet'
import { useAuthStore } from '@/hooks/useAuth'
import { useClipFeed } from '@/hooks/useClips'
import { useMyClipLikes } from '@/hooks/useClipSocial'
import { useMyFollows } from '@/hooks/useEngagement'
import { usePublicShows } from '@/hooks/usePublicShows'
import { shareClip } from '@/lib/share'
import { useNow } from '@/store/useAppStore'
import type { Show } from '@/types'
import { ClipCard } from './ClipCard'
import { ClipComments } from './ClipComments'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * 세로 스와이프 클립 피드.
 *
 * CSS 스크롤 스냅으로 한 장씩 넘깁니다(모멘텀·탄성은 브라우저가 처리). 이번 주에
 * 공연이 있는 팀은 카드 아래에 배너가 붙어 공연 상세로 바로 갑니다 — 클립을 보다가
 * "이 팀 언제 하지"가 되는 순간이 이 앱의 핵심 흐름입니다.
 *
 * ★ 재생은 지금 보이는 카드 하나만 합니다. 전부 재생하면 데이터가 순식간에
 *   나가고 폰이 뜨거워집니다.
 */
export function ClipFeed() {
  const navigate = useNavigate()
  const { clipId } = useParams<{ clipId: string }>()
  const nowIso = useNow()
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const clips = useClipFeed()
  const likes = useMyClipLikes()
  const follows = useMyFollows()
  const shows = usePublicShows()

  const containerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [commentsFor, setCommentsFor] = useState<string | null>(null)
  const [reportFor, setReportFor] = useState<string | null>(null)
  // 공유 링크로 들어온 클립으로 한 번만 이동합니다
  const jumped = useRef(false)

  // 팀별 "가장 가까운 이번 주 공연"
  const upcomingByArtist = useMemo(() => {
    const now = new Date(nowIso).getTime()
    const map = new Map<string, Show>()
    for (const { show, performer } of shows.data) {
      if (show.source !== 'own' || !performer) continue
      const start = new Date(show.startAt).getTime()
      if (start < now || start > now + WEEK_MS) continue
      const cur = map.get(performer.id)
      if (!cur || start < new Date(cur.startAt).getTime()) map.set(performer.id, show)
    }
    return map
  }, [shows.data, nowIso])

  // 공유 링크(#/audience/clips/:clipId)로 들어오면 그 클립부터 보여줍니다
  useEffect(() => {
    if (jumped.current || !clipId || clips.data.length === 0) return
    const i = clips.data.findIndex((c) => c.id === clipId)
    if (i < 0) return
    jumped.current = true
    const el = containerRef.current
    if (!el) return
    el.scrollTop = i * el.clientHeight
    setIndex(i)
  }, [clipId, clips.data])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el || el.clientHeight === 0) return
    const i = Math.round(el.scrollTop / el.clientHeight)
    setIndex((prev) => (prev === i ? prev : i))
  }

  if (clips.loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0B0B0F]">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/20" />
      </div>
    )
  }

  if (clips.data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg px-6">
        <EmptyState
          art="stage"
          title={clips.error ? '클립을 불러오지 못했어요' : '아직 올라온 클립이 없어요'}
          description={
            clips.error ??
            '공연팀이 짧은 영상을 올리면 여기에 모입니다. 팀을 등록하고 무대 영상을 올려보세요.'
          }
          action={
            clips.error ? (
              <Button variant="outline" onClick={clips.refresh}>
                다시 시도
              </Button>
            ) : (
              <Button variant="brand" onClick={() => navigate('/artist/me')}>
                공연팀 등록하기
              </Button>
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0B0F]">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      >
        {clips.data.map((clip, i) => {
          const liked = likes.data.includes(clip.id)
          // 집계는 서버 값이지만, 방금 누른 하트는 즉시 반영돼야 합니다.
          // 서버 값에 내 반응만 더해 보여줍니다.
          const serverLiked = clip.likeCount
          const likeCount = liked ? serverLiked + 1 : serverLiked
          return (
            <div key={clip.id} className="h-full w-full snap-start snap-always">
              <ClipCard
                clip={clip}
                active={i === index}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                liked={liked}
                likeCount={likeCount}
                following={follows.data.includes(clip.artistId)}
                onToggleLike={() => requireAuth(() => void likes.toggle(clip.id))}
                onToggleFollow={() => requireAuth(() => void follows.toggle(clip.artistId))}
                onOpenComments={() => setCommentsFor(clip.id)}
                onShare={() => void shareClip(clip)}
                onReport={() => setReportFor(clip.id)}
                upcomingShow={upcomingByArtist.get(clip.artistId) ?? null}
                nowIso={nowIso}
                onOpenShow={(showId) => navigate(`/audience/show/${showId}`)}
              />
            </div>
          )
        })}
      </div>

      {clips.data.length > 1 && (
        <div className="pointer-events-none absolute right-1.5 top-1/2 h-40 w-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
          <div
            className="absolute w-full rounded-full bg-white transition-all duration-300"
            style={{ height: 28, top: (index / (clips.data.length - 1)) * (160 - 28) }}
          />
        </div>
      )}

      {index === 0 && clips.data.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-1 text-white/70">
          <ChevronUp size={18} className="animate-pulse" />
          <span className="text-2xs font-semibold">위로 밀어서 다음 클립 보기</span>
        </div>
      )}

      <ReportSheet
        open={reportFor !== null}
        onClose={() => setReportFor(null)}
        targetType="clip"
        targetId={reportFor ?? ''}
      />

      <ClipComments
        clipId={commentsFor}
        open={commentsFor !== null}
        onClose={() => setCommentsFor(null)}
        onCountChange={() => clips.refresh()}
      />
    </div>
  )
}
