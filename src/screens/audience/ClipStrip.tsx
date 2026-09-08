import { ExternalLink, Play, Video, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Clip } from '@/hooks/useClips'
import { clipEmbed } from '@/lib/clipEmbed'

/**
 * 공연 상세에 붙는 클립 가로 목록.
 *
 * ★ 목록에서는 영상을 재생하지 않습니다. 썸네일만 깔고, 누르면 전체화면으로
 *   열어서 그때 재생합니다. 상세 화면을 여는 것만으로 영상 여러 개가 동시에
 *   내려오면 데이터가 순식간에 나갑니다.
 *
 * 외부 링크 클립은 원본으로 보냅니다. 임베드(iframe)는 플랫폼 정책이 자주 바뀌어
 * 어느 날 조용히 재생이 막힙니다.
 */
export function ClipStrip({ clips }: { clips: Clip[] }) {
  const [playing, setPlaying] = useState<Clip | null>(null)
  if (clips.length === 0) return null

  return (
    <div className="mt-3.5">
      <h4 className="mb-1.5 text-xs font-bold text-ink-2">클립 ({clips.length})</h4>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {clips.map((c) =>
          c.kind === 'upload' || clipEmbed(c.url, false, true).src ? (
            <button
              key={c.id}
              onClick={() => setPlaying(c)}
              className="relative h-32 w-[88px] shrink-0 overflow-hidden rounded-xl bg-surface-2"
            >
              <ClipThumb clip={c} />
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45">
                <Play size={9} className="fill-white text-white" />
              </span>
              {c.durationSec && (
                <span className="tnum absolute bottom-1 right-1 rounded bg-black/55 px-1 text-[9px] font-bold text-white">
                  {c.durationSec}초
                </span>
              )}
            </button>
          ) : (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-32 w-[88px] shrink-0 overflow-hidden rounded-xl bg-surface-2"
            >
              <ClipThumb clip={c} />
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45">
                <ExternalLink size={9} className="text-white" />
              </span>
            </a>
          ),
        )}
      </div>

      {playing &&
        createPortal(
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black">
            <button
              onClick={() => setPlaying(null)}
              aria-label="닫기"
              className="absolute right-4 top-11 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
            >
              <X size={20} />
            </button>
            {/* 전체화면에서는 소리를 켜고 시작합니다 — 사용자가 직접 눌러서 연 화면이라
                자동재생 정책에도 걸리지 않고, 무음으로 트는 게 오히려 이상합니다 */}
            {playing.kind === 'upload' ? (
              <video
                src={playing.url}
                poster={playing.thumbUrl ?? undefined}
                controls
                autoPlay
                playsInline
                className="max-h-full w-full object-contain"
              />
            ) : (
              <iframe
                src={clipEmbed(playing.url, true, false).src ?? undefined}
                title={playing.title || playing.artistName}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

function ClipThumb({ clip }: { clip: Clip }) {
  if (clip.thumbUrl) {
    return (
      <img
        src={clip.thumbUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    )
  }
  return (
    <span className="flex h-full w-full items-center justify-center text-ink-3">
      <Video size={18} />
    </span>
  )
}
