import { Heart, Share2 } from 'lucide-react'
import { GenreTag, SourceBadge, StatusDot } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { PosterArt } from '@/components/ui/PosterArt'
import { countdownLabel, humanDateTime } from '@/lib/datetime'
import { toast } from '@/store/useToast'
import type { Show } from '@/types'

export function ShowDetailHero({
  show,
  posterSeed,
  nowIso,
  liked,
  onToggleLike,
}: {
  show: Show
  posterSeed: string
  nowIso: string
  liked: boolean
  onToggleLike: () => void
}) {
  const countdown = countdownLabel(show.startAt, nowIso, show.durationMin)
  const live = countdown === '진행 중'

  return (
    <div className="relative">
      <PosterArt seed={posterSeed} genre={show.genre} className="h-[260px] w-full" glyphScale={1.3} />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.35) 100%)' }}
      />
      <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <SourceBadge source={show.source} />
          {live ? <StatusDot label="진행 중" tone="live" /> : <StatusDot label={countdown} tone="soon" />}
        </div>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        <IconButton
          label="공유"
          onClick={() => toast('링크가 복사되었습니다', 'success')}
          className="bg-black/35 text-white"
        >
          <Share2 size={16} />
        </IconButton>
        <IconButton
          label={liked ? '좋아요 취소' : '좋아요'}
          onClick={onToggleLike}
          className="bg-black/35 text-white"
        >
          <Heart
            size={16}
            className={liked ? 'fill-[#3D5FC7] text-[#3D5FC7]' : ''}
            strokeWidth={liked ? 0 : 2}
          />
        </IconButton>
      </div>

      <div className="px-4 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <GenreTag genre={show.genre} />
          {show.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-2xs font-semibold text-ink-2"
            >
              {t}
            </span>
          ))}
        </div>
        <h1 className="mt-2 text-xl font-extrabold leading-snug">{show.title}</h1>
        <p className="tnum mt-1 text-sm font-semibold text-ink-2">
          {humanDateTime(show.startAt, nowIso)} · {show.durationMin}분
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">{show.description}</p>
      </div>
    </div>
  )
}
