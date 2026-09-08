import { Music4, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GenreTag } from '@/components/ui/Badge'
import type { ArtistDetail } from '@/hooks/useArtist'
import { useArtistClips } from '@/hooks/useClips'
import { ClipStrip } from './ClipStrip'
import type { Genre } from '@/types'
import { GENRES } from '@/types'

/**
 * 우리 무대 아티스트 블록 (§12).
 *
 * ★ 예전에는 목록에서 온 얇은 객체를 Performer 인 척 받아서, 있지도 않은
 *   followerCount 에 .toLocaleString() 을 부르며 공연 상세를 통째로 크래시시켰습니다.
 *   이제 artists 테이블에서 실제로 읽은 값만 받습니다.
 *
 * 없는 값은 그 줄을 통째로 빼고, 0 이면 0 으로 보여줍니다. 지어내지 않습니다.
 */

/** 우리 장르 목록에 있는 값만 태그로 답니다. 나머지는 원문 그대로 */
function asGenre(raw: string): Genre | null {
  return (GENRES as readonly string[]).includes(raw) ? (raw as Genre) : null
}

export function PerformerBlock({
  artist,
  loading,
  following,
  onToggleFollow,
}: {
  artist: ArtistDetail | null
  loading: boolean
  following: boolean
  onToggleFollow: () => void
}) {
  // 클립은 artist_clips 에서 읽습니다. 업로드본은 눌러서 바로 재생됩니다.
  const clips = useArtistClips(artist?.id)

  if (loading) {
    return (
      <section className="px-4 py-5">
        <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
      </section>
    )
  }
  if (!artist) return null

  const genre = asGenre(artist.genre)

  return (
    <section className="px-4 py-5">
      <h2 className="mb-3 text-[15px] font-bold">아티스트</h2>
      <div className="flex items-start gap-3">
        {artist.photos[0] ? (
          <img
            src={artist.photos[0]}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3">
            <Music4 size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[16px] font-extrabold">{artist.teamName}</h3>
            <GenreTag genre={genre} label={genre ? undefined : artist.genre} size="sm" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="tnum text-2xs text-ink-3">
              {artist.memberCount}명 · {artist.durationMin}분 공연
            </span>
            {artist.pastShowCount > 0 && (
              <span className="tnum text-2xs text-ink-3">지난 공연 {artist.pastShowCount}회</span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={following ? 'solid' : 'brand'}
          leading={<Users size={13} />}
          onClick={onToggleFollow}
          className="shrink-0"
        >
          {following ? '팔로잉' : '팔로우'}
        </Button>
      </div>

      {artist.bio && (
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
          {artist.bio}
        </p>
      )}

      {artist.setlist.length > 0 && (
        <div className="mt-3.5">
          <h4 className="mb-1.5 text-xs font-bold text-ink-2">셋리스트</h4>
          <ol className="space-y-1">
            {artist.setlist.map((s, i) => (
              <li key={`${s}-${i}`} className="flex gap-2 text-[13px] text-ink">
                <span className="tnum shrink-0 text-ink-3">{i + 1}.</span>
                <span className="min-w-0 truncate">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <ClipStrip clips={clips.data} />

      <p className="mt-3 text-2xs leading-relaxed text-ink-3">
        팔로우하면 이 팀의 새 공연이 열릴 때 알림을 보내드려요.
      </p>
    </section>
  )
}

/** 등록 공연(KOPIS)의 출연진 표기 — 아티스트 계정이 없어 팔로우 없이 텍스트만 */
export function KopisCastBlock({ cast, genreLabel }: { cast: string; genreLabel: string }) {
  return (
    <section className="px-4 py-5">
      <h2 className="mb-2 text-[15px] font-bold">출연진</h2>
      <p className="text-[13px] leading-relaxed text-ink-2">{cast}</p>
      <p className="mt-2 text-2xs text-ink-3">
        장르: {genreLabel} · KOPIS(공연예술통합전산망) 등록 공연 정보를 기반으로 표시됩니다.
      </p>
    </section>
  )
}
