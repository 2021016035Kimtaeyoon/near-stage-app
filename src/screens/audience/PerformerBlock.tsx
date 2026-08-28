import { Heart, Play, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GenreTag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PosterArt, Rating, SeedAvatar } from '@/components/ui/PosterArt'
import { cn } from '@/lib/cn'
import type { Performer } from '@/types'

/** 우리 무대 공연자 블록 — 프로필, 팔로워, 셋리스트, 클립 썸네일 */
export function PerformerBlock({
  performer,
  following,
  onToggleFollow,
}: {
  performer: Performer
  following: boolean
  onToggleFollow: () => void
}) {
  const navigate = useNavigate()
  return (
    <section className="border-t border-border px-4 py-5">
      <h2 className="mb-3 text-[15px] font-bold">공연자</h2>
      <div className="flex items-start gap-3">
        <SeedAvatar seed={performer.photoSeed} genre={performer.genre} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[16px] font-extrabold">{performer.teamName}</h3>
            <GenreTag genre={performer.genre} size="sm" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={performer.rating} count={performer.reviewCount} />
            <span className="tnum flex items-center gap-1 text-2xs text-ink-3">
              <Users size={11} />
              팔로워 {performer.followerCount.toLocaleString('ko-KR')}
            </span>
            <span className="tnum text-2xs text-ink-3">과거 공연 {performer.pastShowCount}회</span>
          </div>
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

      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{performer.bio}</p>

      <div className="mt-3.5">
        <h4 className="mb-1.5 text-xs font-bold text-ink-2">셋리스트</h4>
        <ol className="space-y-1">
          {performer.setlist.map((s, i) => (
            <li key={s} className="flex gap-2 text-[13px] text-ink">
              <span className="tnum shrink-0 text-ink-3">{i + 1}.</span>
              <span className="min-w-0 truncate">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3.5">
        <h4 className="mb-1.5 text-xs font-bold text-ink-2">클립 ({performer.clipCount})</h4>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {performer.clipTitles.map((title, i) => (
            <button
              key={title}
              onClick={() => navigate('/audience/clips')}
              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl"
            >
              <PosterArt
                seed={`${performer.photoSeed}-clip-${i}`}
                genre={performer.genre}
                className="h-full w-full"
                deep
                glyphScale={0.7}
              />
              <span
                className={cn(
                  'absolute inset-x-1 bottom-1 line-clamp-2 rounded-md bg-black/45 px-1 py-0.5 text-left text-[9px] font-semibold leading-tight text-white',
                )}
              >
                {title}
              </span>
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45">
                <Play size={9} className="fill-white text-white" />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-2xs text-ink-3">
        <Heart size={12} />
        {performer.followerCount.toLocaleString('ko-KR')}명이 이 팀을 팔로우하고 있어요
      </div>
    </section>
  )
}

/** 등록 공연(KOPIS)의 출연진 표기 — 공연자 계정이 없어 클립·팔로우 없이 텍스트만 */
export function KopisCastBlock({ cast, genreLabel }: { cast: string; genreLabel: string }) {
  return (
    <section className="border-t border-border px-4 py-5">
      <h2 className="mb-2 text-[15px] font-bold">출연진</h2>
      <p className="text-[13px] leading-relaxed text-ink-2">{cast}</p>
      <p className="mt-2 text-2xs text-ink-3">
        장르: {genreLabel} · KOPIS(공연예술통합전산망) 등록 공연 정보를 기반으로 표시됩니다.
      </p>
    </section>
  )
}
