import { ChevronUp } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, useNow } from '@/store/useAppStore'
import type { Performer, Show } from '@/types'
import { ClipCard } from './ClipCard'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

interface ClipEntry {
  key: string
  performer: Performer
  title: string
  seed: string
  position: number
  total: number
}

/** 공연자마다 등록된 클립 제목들을 낱개의 "숏폼 카드"로 펼칩니다 (제목이 없으면 팀명으로 대체) */
function buildClipEntries(performers: Performer[]): ClipEntry[] {
  const out: ClipEntry[] = []
  for (const performer of performers) {
    const titles = performer.clipTitles.length > 0 ? performer.clipTitles : [`${performer.teamName} 하이라이트`]
    titles.forEach((title, i) => {
      out.push({
        key: `${performer.id}-${title}-${i}`,
        performer,
        title,
        seed: `${performer.id}-clip-${title}`,
        position: i + 1,
        total: titles.length,
      })
    })
  }
  return out
}

/**
 * 세로 스와이프 풀스크린 클립 피드.
 * 네이티브 CSS 스크롤 스냅으로 카드 하나씩 넘기며(모멘텀·탄성은 브라우저가 처리),
 * 이번 주 공연이 있는 팀은 카드 하단에 유입 배너를 띄워 공연 상세로 바로 연결합니다(핵심 유입 루프).
 * 영상은 우리가 호스팅하지 않습니다 — 아티스트가 등록한 외부 링크로 이동합니다.
 */
export function ClipFeed() {
  const navigate = useNavigate()
  const performers = useAppStore((s) => s.performers)
  const shows = useAppStore((s) => s.shows)
  const nowIso = useNow()
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const toggleFollow = useAppStore((s) => s.toggleFollow)

  const containerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
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

  const clips = useMemo(() => buildClipEntries(performers), [performers])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el || el.clientHeight === 0) return
    const i = Math.round(el.scrollTop / el.clientHeight)
    setIndex((prev) => (prev === i ? prev : i))
  }


  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0B0F]">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      >
        {clips.map((clip) => (
          <div key={clip.key} className="h-full w-full snap-start snap-always">
            <ClipCard
              performer={clip.performer}
              clipTitle={clip.title}
              posterSeed={clip.seed}
              clipPosition={clip.position}
              clipTotal={clip.total}
              liked={likedClips.has(clip.key)}
              following={followedPerformerIds.includes(clip.performer.id)}
              onToggleLike={() =>
                setLikedClips((prev) => {
                  const next = new Set(prev)
                  if (next.has(clip.key)) next.delete(clip.key)
                  else next.add(clip.key)
                  return next
                })
              }
              onToggleFollow={() => toggleFollow(clip.performer.id)}
              upcomingShow={upcomingByPerformer.get(clip.performer.id) ?? null}
              nowIso={nowIso}
              onOpenShow={(showId) => navigate(`/audience/show/${showId}`)}
            />
          </div>
        ))}
      </div>


      {/* 전체 진행도 (개수가 많아 점 대신 슬림 스크롤바 형태로 표시) */}
      {clips.length > 1 && (
        <div className="pointer-events-none absolute right-1.5 top-1/2 h-40 w-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
          <div
            className="absolute w-full rounded-full bg-white transition-all duration-300"
            style={{
              height: 28,
              top: (index / (clips.length - 1)) * (160 - 28),
            }}
          />
        </div>
      )}

      {index === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-1 text-white/70">
          <ChevronUp size={18} className="animate-pulse" />
          <span className="text-2xs font-semibold">위로 밀어서 다음 하이라이트 보기</span>
        </div>
      )}

    </div>
  )
}
