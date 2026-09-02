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
    <div>
      {/* 사진 위에 얹는 배지·버튼은 이 컨테이너에만 relative를 걸어 260px 안에서만
          absolute로 자리잡게 합니다. 예전엔 아래 텍스트 블록까지 같은 relative 부모에
          있어서, 배지가 사진이 아니라 "이미지+텍스트 전체 높이" 기준 bottom-3로 계산돼
          본문 중간(설명 문단 근처)까지 밀려 내려가 텍스트와 겹쳐 보였습니다. */}
      <div className="relative">
        <PosterArt seed={posterSeed} genre={show.genre} className="h-[260px] w-full" glyphScale={1.3} />
        {/* 배지 가독성용 어둡게 처리 — 앞줄 관객 실루엣과 겹치는 영역이라 페이지 배경색으로
            직접 블렌딩하지 않습니다(했더니 실루엣이 반쯤 지워져 사진이 잘려 겹쳐 보이는 것처럼
            보였습니다). 순수 검정 단일 톤으로만 어둡게 해 사진 자체의 톤과 자연스럽게 이어집니다. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.5) 100%)' }}
        />
        {/* 이 배지 줄은 항상 어두운 사진 위에 올라가므로, 라이트 테마에서도 금색 토큰이
            밝은 노랑으로 읽히도록 이 영역만 다크 팔레트로 고정합니다. */}
        <div
          data-theme="dark"
          className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2"
        >
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
              className={liked ? 'fill-[#FFC42E] text-[#FFC42E]' : ''}
              strokeWidth={liked ? 0 : 2}
            />
          </IconButton>
        </div>
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
