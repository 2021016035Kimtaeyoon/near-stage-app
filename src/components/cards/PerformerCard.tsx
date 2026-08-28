import { Clapperboard, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { GenreTag } from '@/components/ui/Badge'
import { PosterArt, Rating } from '@/components/ui/PosterArt'
import { priceLabel } from '@/lib/datetime'
import type { Performer } from '@/types'

interface Props {
  performer: Performer
  onClick?: () => void
  /** 조건 대조 결과 등 카드 하단에 붙는 내용 */
  footer?: ReactNode
  right?: ReactNode
}

export function PerformerCard({ performer, onClick, footer, right }: Props) {
  return (
    <article className="card p-3">
      <div className="flex gap-3">
        <button onClick={onClick} className="flex min-w-0 flex-1 gap-3 text-left">
          <PosterArt
            seed={performer.photoSeed}
            genre={performer.genre}
            className="h-[84px] w-[84px] shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <GenreTag genre={performer.genre} size="sm" />
              <span className="tnum text-2xs text-ink-3">{performer.memberCount}인</span>
              <span className="tnum text-2xs text-ink-3">{performer.durationMin}분</span>
            </div>
            <h3 className="mt-1.5 truncate text-[15px] font-bold leading-snug">
              {performer.teamName}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-2">{performer.bio}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Rating value={performer.rating} count={performer.reviewCount} />
              <span className="tnum flex items-center gap-1 text-2xs text-ink-3">
                <Users size={11} />
                {performer.followerCount.toLocaleString('ko-KR')}
              </span>
              <span className="tnum flex items-center gap-1 text-2xs text-ink-3">
                <Clapperboard size={11} />
                {performer.clipCount}
              </span>
              <span className="tnum text-2xs text-ink-3">
                희망 {priceLabel(performer.wantedFee)}
              </span>
            </div>
          </div>
        </button>
        {right}
      </div>
      {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
    </article>
  )
}
