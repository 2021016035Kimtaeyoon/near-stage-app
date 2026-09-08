import { ExternalLink, Heart, Music4, Play, Ticket, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Clip } from '@/hooks/useClips'
import { countdownLabel } from '@/lib/datetime'
import { cn } from '@/lib/cn'
import type { Show } from '@/types'

/**
 * 클립 카드 한 장 — 화면을 꽉 채우는 세로 영상.
 *
 * ★ 보이는 카드만 재생합니다. 전부 재생하면 데이터가 순식간에 나가고 폰이 뜨거워집니다.
 *   IntersectionObserver 로 화면에 들어올 때 play, 나갈 때 pause 합니다.
 *
 * ★ 소리는 꺼진 채로 시작합니다. 브라우저가 소리 있는 자동재생을 막기도 하고,
 *   무엇보다 지하철에서 앱을 열었는데 소리가 나면 다시는 안 엽니다.
 */
export function ClipCard({
  clip,
  active,
  muted,
  onToggleMute,
  liked,
  following,
  onToggleLike,
  onToggleFollow,
  upcomingShow,
  nowIso,
  onOpenShow,
}: {
  clip: Clip
  /** 지금 화면에 보이는 카드인지 */
  active: boolean
  muted: boolean
  onToggleMute: () => void
  liked: boolean
  following: boolean
  onToggleLike: () => void
  onToggleFollow: () => void
  upcomingShow: Show | null
  nowIso: string
  onOpenShow: (showId: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      // 자동재생이 거부돼도 화면은 그대로 둡니다 — 사용자가 탭하면 재생됩니다
      void v.play().catch(() => undefined)
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [active])

  const isUpload = clip.kind === 'upload' && !failed

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0B0F]">
      {isUpload ? (
        <video
          ref={videoRef}
          src={clip.url}
          poster={clip.thumbUrl ?? undefined}
          muted={muted}
          loop
          playsInline
          preload={active ? 'auto' : 'none'}
          onError={() => setFailed(true)}
          onClick={() => {
            const v = videoRef.current
            if (!v) return
            if (v.paused) void v.play().catch(() => undefined)
            else v.pause()
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // 외부 링크 클립 — 임베드는 플랫폼 정책이 자주 바뀌어 조용히 막힙니다.
        // 썸네일을 크게 깔고 원본으로 보냅니다.
        <a
          href={clip.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        >
          {clip.thumbUrl ? (
            <img
              src={clip.thumbUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-b from-[#1A1A24] to-[#0B0B0F]" />
          )}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Play size={26} className="fill-white text-white" />
          </span>
          <span className="relative flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-2xs font-bold text-white">
            원본에서 보기
            <ExternalLink size={11} />
          </span>
        </a>
      )}

      {/* 아래쪽 그라데이션 — 글자가 영상 위에서도 읽히게 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />

      {/* 오른쪽 액션 열 */}
      <div className="absolute bottom-28 right-3 flex flex-col items-center gap-4">
        <button onClick={onToggleLike} aria-label="좋아요" className="flex flex-col items-center gap-1">
          <Heart
            size={28}
            className={liked ? 'fill-danger text-danger' : 'text-white drop-shadow'}
          />
        </button>
        {isUpload && (
          <button onClick={onToggleMute} aria-label="소리" className="flex flex-col items-center">
            {muted ? (
              <VolumeX size={26} className="text-white drop-shadow" />
            ) : (
              <Volume2 size={26} className="text-white drop-shadow" />
            )}
          </button>
        )}
      </div>

      {/* 아래 정보 */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(var(--safe-bottom)+18px)]">
        <div className="flex items-center gap-2.5">
          {clip.artistPhotos[0] ? (
            <img
              src={clip.artistPhotos[0]}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-white/30 object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white">
              <Music4 size={16} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold text-white drop-shadow">
              {clip.artistName}
            </p>
            {clip.artistGenre && (
              <p className="text-2xs text-white/70">{clip.artistGenre}</p>
            )}
          </div>
          <Button
            size="sm"
            variant={following ? 'solid' : 'brand'}
            onClick={onToggleFollow}
            className="shrink-0"
          >
            {following ? '팔로잉' : '팔로우'}
          </Button>
        </div>

        {clip.title && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/90 drop-shadow">
            {clip.title}
          </p>
        )}

        {upcomingShow && (
          <button
            onClick={() => onOpenShow(upcomingShow.id)}
            className={cn(
              'mt-3 flex w-full items-center gap-2 rounded-2xl border border-white/20 bg-white/12 px-3.5 py-3 text-left backdrop-blur',
            )}
          >
            <Ticket size={16} className="shrink-0 text-gold-text" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-white">
                {upcomingShow.title}
              </span>
              <span className="tnum block text-2xs text-white/70">
                {countdownLabel(upcomingShow.startAt, nowIso, upcomingShow.durationMin)}
              </span>
            </span>
            <span className="shrink-0 text-2xs font-bold text-gold-text">보러가기</span>
          </button>
        )}
      </div>
    </div>
  )
}
