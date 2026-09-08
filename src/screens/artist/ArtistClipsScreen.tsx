import { ExternalLink, Play, Plus, Trash2, Video } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { addClips, deleteClip, useArtistClips, type NewClip } from '@/hooks/useClips'
import { useMyArtists } from '@/hooks/useMyResources'
import { MAX_CLIPS } from '@/lib/uploadClip'
import { toast } from '@/store/useToast'
import { ClipLinkEditor } from './ClipLinkEditor'

/**
 * 클립 관리 (/artist/:artistId/clips).
 *
 * 등록할 때만 클립을 넣을 수 있으면, 이미 등록한 팀은 영상을 영영 못 올립니다.
 * 무대 영상은 공연이 끝나야 생기는데, 팀 등록은 그전에 하니까요.
 */
export function ArtistClipsScreen() {
  const navigate = useNavigate()
  const { artistId } = useParams<{ artistId: string }>()
  const userId = useAuthStore((s) => s.userId)
  const artists = useMyArtists()
  const clips = useArtistClips(artistId ?? null)

  const [adding, setAdding] = useState<NewClip[]>([])
  const [busy, setBusy] = useState(false)

  const artist = artists.data.find((a) => a.id === artistId)
  const remaining = Math.max(0, MAX_CLIPS - clips.data.length)

  if (!artists.loading && !artist) {
    return (
      <Screen>
        <ScreenHeader title="클립" back />
        <ScreenBody>
          <EmptyState
            art="search"
            title="팀을 찾을 수 없어요"
            description="내 팀 목록에서 다시 선택해주세요."
            action={
              <Button variant="outline" onClick={() => navigate('/artist/me')}>
                내 팀으로
              </Button>
            }
          />
        </ScreenBody>
      </Screen>
    )
  }

  const save = async () => {
    if (!artistId || adding.length === 0) return
    setBusy(true)
    const err = await addClips(artistId, adding)
    setBusy(false)
    if (err) {
      toast('저장하지 못했어요', 'error', err)
      return
    }
    toast(`클립 ${adding.length}개를 올렸어요`, 'success', '관객의 클립 탭에 바로 뜹니다')
    setAdding([])
    clips.refresh()
  }

  const remove = async (id: string) => {
    const err = await deleteClip(id)
    if (err) {
      toast('지우지 못했어요', 'error', err)
      return
    }
    toast('클립을 지웠어요')
    clips.refresh()
  }

  return (
    <Screen>
      <ScreenHeader title="클립" subtitle={artist?.teamName} back />
      <ScreenBody>
        <p className="mb-4 rounded-xl bg-surface-2 p-3 text-2xs leading-relaxed text-ink-2">
          올린 영상은 관객의 <b>클립 탭</b>과 <b>공연 화면</b>에 그대로 뜹니다. 팀이 공개 중일
          때만 남에게 보입니다.
          {artist?.status !== 'approved' && (
            <>
              {' '}
              지금은 <b>{artist?.status === 'pending' ? '확인 중' : '반려'}</b> 상태라 아직
              사장님께만 보입니다.
            </>
          )}
        </p>

        {clips.loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : clips.data.length === 0 ? (
          <EmptyState
            art="stage"
            title="아직 올린 클립이 없어요"
            description="공연 한 장면을 짧게 올려두면 호스트가 수락을 훨씬 빨리 결정합니다."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {clips.data.map((c) => (
              <div key={c.id} className="relative aspect-[9/16] overflow-hidden rounded-xl bg-surface-2">
                {c.thumbUrl ? (
                  <img src={c.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-3">
                    <Video size={18} />
                  </span>
                )}
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="열기"
                  className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white"
                >
                  {c.kind === 'upload' ? <Play size={11} /> : <ExternalLink size={11} />}
                </a>
                <button
                  onClick={() => void remove(c.id)}
                  aria-label="지우기"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white"
                >
                  <Trash2 size={11} />
                </button>
                <span className="absolute inset-x-1 bottom-1 flex justify-center">
                  <Tag>{c.kind === 'upload' ? `${c.durationSec ?? 0}초` : '링크'}</Tag>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold">
            <Plus size={16} />
            클립 추가
          </h2>
          {remaining === 0 ? (
            <p className="text-2xs leading-relaxed text-ink-3">
              한 팀에 최대 {MAX_CLIPS}개까지 올릴 수 있어요. 새로 올리려면 위에서 하나를
              지워주세요.
            </p>
          ) : (
            <>
              <ClipLinkEditor
                clips={adding}
                onChange={setAdding}
                userId={userId}
                max={remaining}
              />
              {adding.length > 0 && (
                <Button
                  variant="brand"
                  full
                  className="mt-3"
                  loading={busy}
                  onClick={() => void save()}
                >
                  {adding.length}개 저장하기
                </Button>
              )}
            </>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
