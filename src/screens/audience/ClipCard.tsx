import { Heart, Share2, UserPlus, UserCheck, ChevronRight } from 'lucide-react'
import { GenreTag } from '@/components/ui/Badge'
import { PosterArt } from '@/components/ui/PosterArt'
import { humanDateTime } from '@/lib/datetime'
import { toast } from '@/store/useToast'
import type { Performer, Show } from '@/types'

interface Props {
  performer: Performer
  liked: boolean
  following: boolean
  onToggleLike: () => void
  onToggleFollow: () => void
  /** 이번 주 이 팀 공연 (있으면 유입 배너 노출 — 핵심 유입 루프) */
  upcomingShow: Show | null
  nowIso: string
  onOpenShow: (showId: string) => void
}

export function ClipCard({
  performer,
  liked,
  following,
  onToggleLike,
  onToggleFollow,
  upcomingShow,
  nowIso,
  onOpenShow,
}: Props) {
  return (
    <div className="relative h-full w-full shrink-0 overflow-hidden">
      <PosterArt
        seed={performer.photoSeed}
        genre={performer.genre}
        className="absolute inset-0 h-full w-full"
        deep
        glyphScale={1.9}
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-12">
        <GenreTag genre={performer.genre} />
        <span className="rounded-full bg-black/40 px-2.5 py-1 text-2xs font-bold text-white">
          클립 {performer.clipCount}개
        </span>
      </div>

      {/* 우측 액션 버튼 */}
      <div className="absolute bottom-40 right-3 flex flex-col items-center gap-5">
        <button
          onClick={onToggleLike}
          aria-label={liked ? '좋아요 취소' : '좋아요'}
          className="flex flex-col items-center gap-1 text-white"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35">
            <Heart size={22} className={liked ? 'fill-[#FF3D77] text-[#FF3D77]' : ''} />
          </span>
          <span className="text-2xs font-bold drop-shadow">
            {(performer.followerCount / 10).toFixed(0)}
          </span>
        </button>
        <button
          onClick={() => toast('링크가 복사되었습니다', 'success')}
          aria-label="공유"
          className="flex flex-col items-center gap-1 text-white"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35">
            <Share2 size={20} />
          </span>
          <span className="text-2xs font-bold drop-shadow">공유</span>
        </button>
        <button
          onClick={onToggleFollow}
          aria-label={following ? '팔로잉' : '팔로우'}
          className="flex flex-col items-center gap-1 text-white"
        >
          <span
            className={
              following
                ? 'flex h-11 w-11 items-center justify-center rounded-full bg-white/25'
                : 'brand-gradient flex h-11 w-11 items-center justify-center rounded-full'
            }
          >
            {following ? <UserCheck size={20} /> : <UserPlus size={20} />}
          </span>
          <span className="text-2xs font-bold drop-shadow">{following ? '팔로잉' : '팔로우'}</span>
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white">
        <h2 className="text-lg font-extrabold drop-shadow">{performer.teamName}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-white/85 drop-shadow">
          {performer.bio}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {performer.setlist.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-white/15 px-2 py-0.5 text-2xs font-semibold backdrop-blur-sm"
            >
              🎵 {s}
            </span>
          ))}
        </div>

        {/* ★ 핵심 유입 루프 배너 */}
        {upcomingShow && (
          <button
            onClick={() => onOpenShow(upcomingShow.id)}
            className="brand-gradient mt-3 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left"
            style={{ boxShadow: '0 10px 28px rgba(255,61,119,.4)' }}
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-extrabold leading-tight">
                이번 주 이 팀 공연 있어요 →
              </span>
              <span className="tnum mt-0.5 block text-2xs font-semibold text-white/90">
                {humanDateTime(upcomingShow.startAt, nowIso)} · {upcomingShow.title}
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0" />
          </button>
        )}
      </div>
    </div>
  )
}
