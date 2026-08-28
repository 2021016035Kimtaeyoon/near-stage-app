import { motion } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Show } from '@/types'
import { ClipCard } from './ClipCard'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * 세로 스와이프 풀스크린 클립 피드.
 * framer-motion drag로 카드 하나씩 넘기며, 이번 주 공연이 있는 팀은
 * 카드 하단에 유입 배너를 띄워 공연 상세로 바로 연결합니다(핵심 유입 루프).
 */
export function ClipFeed() {
  const navigate = useNavigate()
  const performers = useAppStore((s) => s.performers)
  const shows = useAppStore((s) => s.shows)
  const nowIso = useAppStore((s) => s.demoNowIso)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const toggleFollow = useAppStore((s) => s.toggleFollow)

  const [index, setIndex] = useState(0)
  const [viewportH, setViewportH] = useState(0)
  // 클립 자체에 대한 좋아요는 공연 예약과 무관한 가벼운 반응이라 세션 로컬 상태로 둡니다
  const [likedClips, setLikedClips] = useState<Set<string>>(new Set())

  const upcomingByPerformer = useMemo(() => {
    const now = new Date(nowIso).getTime()
    const map = new Map<string, Show>()
    for (const show of shows) {
      if (show.source !== 'own' || !show.performerId) continue
      const start = new Date(show.startAt).getTime()
      if (start < now || start > now + WEEK_MS) continue
      const existing = map.get(show.performerId)
      if (!existing || start < new Date(existing.startAt).getTime()) {
        map.set(show.performerId, show)
      }
    }
    return map
  }, [shows, nowIso])

  // 클립이 있는 팀만 (모든 팀이 clipCount>0 이므로 전체 노출)
  const list = performers

  const measureHeight = (el: HTMLDivElement | null) => {
    if (el) setViewportH(el.clientHeight)
  }

  const clampIndex = (n: number) => Math.max(0, Math.min(list.length - 1, n))

  return (
    <div ref={measureHeight} className="relative h-full w-full overflow-hidden bg-[#0B0B0F]">
      <motion.div
        className="h-full w-full"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        animate={{ y: -index * viewportH }}
        transition={{ type: 'spring', stiffness: 340, damping: 38 }}
        onDragEnd={(_, info) => {
          const threshold = viewportH * 0.18
          if (info.offset.y < -threshold || info.velocity.y < -600) {
            setIndex((i) => clampIndex(i + 1))
          } else if (info.offset.y > threshold || info.velocity.y > 600) {
            setIndex((i) => clampIndex(i - 1))
          }
        }}
      >
        {list.map((performer) => (
          <div key={performer.id} style={{ height: viewportH || '100%' }}>
            <ClipCard
              performer={performer}
              liked={likedClips.has(performer.id)}
              following={followedPerformerIds.includes(performer.id)}
              onToggleLike={() =>
                setLikedClips((prev) => {
                  const next = new Set(prev)
                  if (next.has(performer.id)) next.delete(performer.id)
                  else next.add(performer.id)
                  return next
                })
              }
              onToggleFollow={() => toggleFollow(performer.id)}
              upcomingShow={upcomingByPerformer.get(performer.id) ?? null}
              nowIso={nowIso}
              onOpenShow={(showId) => navigate(`/audience/show/${showId}`)}
            />
          </div>
        ))}
      </motion.div>

      {/* 진행 표시 */}
      <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
        {list.map((_, i) => (
          <span
            key={i}
            className={
              i === index
                ? 'h-4 w-1 rounded-full bg-white'
                : 'h-1.5 w-1 rounded-full bg-white/35'
            }
          />
        ))}
      </div>

      {index === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-1 text-white/70">
          <ChevronUp size={18} className="animate-bounce" />
          <span className="text-2xs font-semibold">위로 밀어서 다음 팀 보기</span>
        </div>
      )}
    </div>
  )
}
