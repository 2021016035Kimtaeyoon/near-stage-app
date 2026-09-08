import {
  ExternalLink,
  Flag,
  Heart,
  MessageCircle,
  Music4,
  Pause,
  Share2,
  Ticket,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Clip } from '@/hooks/useClips'
import { clipEmbed } from '@/lib/clipEmbed'
import { countdownLabel } from '@/lib/datetime'
import type { Show } from '@/types'

/**
 * 클립 한 장 — 화면을 꽉 채우는 세로 영상.
 *
 * ★ 재생 버튼을 두지 않습니다. 화면에 들어오면 바로 재생되고, 화면을 탭하면
 *   멈춥니다. 쇼츠를 볼 때 아무도 재생 버튼을 찾지 않습니다.
 *
 * ★ 보이는 카드만 재생합니다. 전부 재생하면 데이터가 순식간에 나가고 폰이
 *   뜨거워집니다.
 *
 * ★ 소리는 꺼진 채 시작합니다. 브라우저가 소리 있는 자동재생을 막기도 하고,
 *   무엇보다 지하철에서 앱을 열었는데 소리가 나면 다시는 안 엽니다.
 */
export function ClipCard({
  clip,
  active,
  muted,
  onToggleMute,
  liked,
  likeCount,
  following,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onShare,
  onReport,
  upcomingShow,
  nowIso,
  onOpenShow,
}: {
  clip: Clip
  active: boolean
  muted: boolean
  onToggleMute: () => void
  liked: boolean
  likeCount: number
  following: boolean
  onToggleLike: () => void
  onToggleFollow: () => void
  onOpenComments: () => void
  onShare: () => void
  onReport: () => void
  upcomingShow: Show | null
  nowIso: string
  onOpenShow: (showId: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)

  const embed = clip.kind === 'link' ? clipEmbed(clip.url, active, muted) : null
  const isVideo = clip.kind === 'upload' && !failed
  const isEmbed = !!embed?.src

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      setPaused(false)
      // 자동재생이 거부돼도 화면은 그대로 둡니다 — 탭하면 재생됩니다
      void v.play().catch(() => setPaused(true))
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [active])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play().catch(() => undefined)
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0B0F]">
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={clip.url}
            poster={clip.thumbUrl ?? undefined}
            muted={muted}
            loop
            playsInline
            preload={active ? 'auto' : 'none'}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* 탭 영역. 영상 위에 깔아서 어디를 눌러도 멈춥니다 */}
          <button
            onClick={togglePlay}
            aria-label={paused ? '재생' : '일시정지'}
            className="absolute inset-0 z-10"
          >
            {paused && (
              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 backdrop-blur">
                <Pause size={26} className="fill-white text-white" />
              </span>
            )}
          </button>
        </>
      ) : isEmbed ? (
        // 유튜브·비메오는 임베드로 바로 재생됩니다. iframe 안쪽은 우리가 제어할 수
        // 없어서 탭으로 멈추는 건 플레이어에 맡깁니다.
        <iframe
          key={`${clip.id}-${active}-${muted}`}
          src={embed.src ?? undefined}
          title={clip.title || clip.artistName}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute left-1/2 top-1/2 h-[177.78vw] max-h-full w-[177.78vh] max-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        />
      ) : (
        // 인스타그램·틱톡은 자동재생 임베드를 주지 않습니다. 검은 화면을 띄우느니
        // 있는 그대로 말하고 원본으로 보냅니다.
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
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-b from-[#1A1A24] to-[#0B0B0F]" />
          )}
          <span className="relative flex items-center gap-1.5 rounded-full bg-black/55 px-4 py-2 text-2xs font-bold text-white backdrop-blur">
            이 플랫폼은 앱 안에서 재생할 수 없어요 · 원본 열기
            <ExternalLink size={12} />
          </span>
        </a>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      {/* 오른쪽 액션 열 */}
      <div className="absolute bottom-[200px] right-3 z-20 flex flex-col items-center gap-5">
        <button onClick={onToggleLike} aria-label="좋아요" className="flex flex-col items-center gap-1">
          <Heart size={30} className={liked ? 'fill-danger text-danger' : 'text-white drop-shadow'} />
          <span className="tnum text-2xs font-bold text-white drop-shadow">{likeCount}</span>
        </button>

        <button onClick={onOpenComments} aria-label="댓글" className="flex flex-col items-center gap-1">
          <MessageCircle size={28} className="text-white drop-shadow" />
          <span className="tnum text-2xs font-bold text-white drop-shadow">{clip.commentCount}</span>
        </button>

        <button onClick={onShare} aria-label="공유" className="flex flex-col items-center gap-1">
          <Share2 size={26} className="text-white drop-shadow" />
          <span className="text-2xs font-bold text-white drop-shadow">공유</span>
        </button>

        <button onClick={onReport} aria-label="신고" className="flex flex-col items-center">
          <Flag size={22} className="text-white/70 drop-shadow" />
        </button>

        {(isVideo || isEmbed) && (
          <button onClick={onToggleMute} aria-label="소리" className="flex flex-col items-center">
            {muted ? (
              <VolumeX size={24} className="text-white drop-shadow" />
            ) : (
              <Volume2 size={24} className="text-white drop-shadow" />
            )}
          </button>
        )}
      </div>

      {/* 아래 정보 */}
      {/* ★ 하단 탭(76px) 위로 올립니다. 예전에는 '보러가기' 배너가 탭 아래 깔려서
          눌러도 '알림' 탭이 눌렸습니다. 클립은 메인 탭이라 탭바를 숨길 수 없습니다. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(var(--safe-bottom)+90px)]">
        <div className="pointer-events-auto flex items-center gap-2.5">
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
            {clip.artistGenre && <p className="text-2xs text-white/70">{clip.artistGenre}</p>}
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
          <p className="pointer-events-auto mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/90 drop-shadow">
            {clip.title}
          </p>
        )}

        {upcomingShow && (
          <button
            onClick={() => onOpenShow(upcomingShow.id)}
            className="pointer-events-auto mt-3 flex w-full items-center gap-2 rounded-2xl border border-white/20 bg-white/12 px-3.5 py-3 text-left backdrop-blur"
          >
            <Ticket size={16} className="shrink-0 text-gold-text" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-white">
                {upcomingShow.title}
              </span>
              <span className="tnum block text-2xs text-white/70">
                {countdownLabel(upcomingShow, nowIso)}
              </span>
            </span>
            <span className="shrink-0 text-2xs font-bold text-gold-text">보러가기</span>
          </button>
        )}
      </div>
    </div>
  )
}
