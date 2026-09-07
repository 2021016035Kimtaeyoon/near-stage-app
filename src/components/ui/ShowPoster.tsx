import { useState } from 'react'
import { cn } from '@/lib/cn'
import { PosterArt } from './PosterArt'
import type { Genre } from '@/types'

/**
 * 공연 이미지.
 *
 * 등록 공연(KOPIS)은 실제 포스터가 있습니다. 그걸 두고 우리가 그려낸 대체 이미지를
 * 쓰는 건 있는 정보를 버리는 일입니다. 우리 무대는 아직 사진이 없을 수 있으므로
 * 그때만 PosterArt 로 대체합니다.
 *
 * 이미지가 깨지면(원본 삭제·차단) 조용히 PosterArt 로 되돌아갑니다 — 깨진 이미지
 * 아이콘을 카드에 남기지 않기 위함입니다.
 */
export function ShowPoster({
  posterUrl,
  seed,
  genre,
  className,
  deep = false,
  /** 목록에서는 lazy, 상세 첫 화면에서는 eager */
  eager = false,
  overlay,
}: {
  posterUrl?: string
  seed: string
  genre: Genre | null
  className?: string
  deep?: boolean
  eager?: boolean
  overlay?: React.ReactNode
}) {
  const [broken, setBroken] = useState(false)

  if (!posterUrl || broken) {
    return (
      <PosterArt seed={seed} genre={genre} className={className} deep={deep} overlay={overlay} />
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-surface-3', className)}>
      <img
        src={posterUrl}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setBroken(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* 포스터는 글자가 많아 위에 얹는 뱃지가 묻힙니다. 아래쪽만 살짝 눌러줍니다 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,.18) 0%, transparent 34%, rgba(0,0,0,.28) 100%)',
        }}
      />
      {overlay}
    </div>
  )
}
