import { Mail, Users } from 'lucide-react'
import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { GenreTag } from '@/components/ui/Badge'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyVenues } from '@/hooks/useMyResources'
import { useMyPosts } from '@/hooks/usePosts'
import { usePublicArtists, type PublicArtist } from '@/hooks/usePublicArtists'
import { GENRES, type Genre } from '@/types'
import { InviteToPostSheet } from './InviteToPostSheet'

/**
 * 아티스트 탐색 (호스트).
 *
 * ★ 마켓플레이스가 반쪽이었습니다. 아티스트는 공간을 탐색할 수 있는데
 *   (/performer/explore) 호스트는 구인글을 올리고 지원이 오기만 기다릴 수밖에
 *   없었습니다. 마음에 드는 팀을 봐도 연락할 방법이 없었습니다.
 *
 * 팀을 눌러 초대를 보냅니다 — 채팅이 아니라 구인글 + 짧은 메시지 한 번입니다.
 * 자유 대화는 공연이 확정된 뒤에만 엽니다(§13).
 */
export function ArtistExploreScreen() {
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const artists = usePublicArtists()
  const venues = useMyVenues()
  const approvedVenueIds = venues.data.filter((v) => v.status === 'approved').map((v) => v.id)
  const posts = useMyPosts(approvedVenueIds)
  const openPosts = posts.data.filter((p) => p.status === 'open')

  const [genres, setGenres] = useState<Genre[]>([])
  const [inviting, setInviting] = useState<PublicArtist | null>(null)

  const toggleGenre = (g: Genre) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))

  const rows = artists.data.filter((a) => genres.length === 0 || (a.genre && genres.includes(a.genre)))

  // ★ 공간이 없거나 구인글이 없어도 시트를 엽니다. 시트가 그 상태를 그대로
  //   설명합니다 — 버튼을 숨기거나 조용히 무시하면 왜 안 되는지 알 수 없습니다.
  const openInvite = (a: PublicArtist) => requireAuth(() => setInviting(a))

  return (
    <Screen>
      <ScreenHeader title="아티스트 탐색" subtitle="우리 무대에 세울 팀을 찾습니다" />
      <ScreenBody>
        <div className="no-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4">
          {GENRES.map((g) => (
            <Chip key={g} active={genres.includes(g)} onClick={() => toggleGenre(g)}>
              {g}
            </Chip>
          ))}
        </div>

        {!userId ? null : venues.loading === false && approvedVenueIds.length === 0 ? (
          <div className="card mb-3 p-3.5">
            <p className="text-2xs leading-relaxed text-ink-2">
              공간이 승인되면 여기서 팀을 초대할 수 있어요. 지금은 둘러보기만 됩니다.
            </p>
          </div>
        ) : openPosts.length === 0 && approvedVenueIds.length > 0 ? (
          <div className="card mb-3 p-3.5">
            <p className="text-2xs leading-relaxed text-ink-2">
              초대하려면 열려 있는 구인글이 필요해요. 구인 탭에서 먼저 글을 올려주세요.
            </p>
          </div>
        ) : null}

        {artists.loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : artists.error ? (
          <EmptyState
            art="search"
            title="불러오지 못했어요"
            description={artists.error}
            action={
              <Button variant="outline" onClick={artists.refresh}>
                다시 시도
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            art="search"
            title={artists.data.length === 0 ? '공개된 팀이 아직 없어요' : '조건에 맞는 팀이 없어요'}
            description={
              artists.data.length === 0
                ? '팀이 승인되면 여기에 뜹니다.'
                : '장르 조건을 넓혀보세요.'
            }
            action={
              genres.length > 0 ? (
                <Button variant="outline" onClick={() => setGenres([])}>
                  조건 초기화
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2.5">
            {rows.map((a) => (
              <ArtistRow key={a.id} artist={a} onInvite={() => openInvite(a)} />
            ))}
          </div>
        )}

        <TabBarSpacer />
      </ScreenBody>

      <InviteToPostSheet
        open={inviting !== null}
        onClose={() => setInviting(null)}
        artist={inviting}
        posts={openPosts}
        onDone={() => posts.refresh()}
      />
    </Screen>
  )
}

function ArtistRow({ artist, onInvite }: { artist: PublicArtist; onInvite: () => void }) {
  return (
    <div className="card flex gap-3 p-3.5">
      {artist.photos[0] ? (
        <img
          src={artist.photos[0]}
          alt=""
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
          <Users size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{artist.teamName}</span>
          {artist.genre && <GenreTag genre={artist.genre} size="sm" />}
        </div>
        <p className="tnum mt-0.5 text-2xs text-ink-2">
          {artist.memberCount}인 · 세트 {artist.durationMin}분
        </p>
        {artist.bio && (
          <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-ink-3">{artist.bio}</p>
        )}
        <Button
          size="sm"
          variant="outline"
          leading={<Mail size={12} />}
          onClick={onInvite}
          className="mt-2"
        >
          초대하기
        </Button>
      </div>
    </div>
  )
}
