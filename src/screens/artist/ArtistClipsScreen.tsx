import { ExternalLink, Pencil, Play, Plus, Trash2, Video } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { addClips, deleteClip, updateClip, useArtistClips, type Clip, type NewClip } from '@/hooks/useClips'
import { useMyArtists } from '@/hooks/useMyResources'
import { clipThumbnail } from '@/lib/clipEmbed'
import { MAX_CLIPS } from '@/lib/uploadClip'
import { toast } from '@/store/useToast'
import { validateClipUrl } from './artistDraft'
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
  const [editing, setEditing] = useState<Clip | null>(null)

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
                <div className="absolute right-1 top-1 flex gap-1">
                  <button
                    onClick={() => setEditing(c)}
                    aria-label="수정"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => void remove(c.id)}
                    aria-label="지우기"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
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

      <ClipEditSheet
        clip={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          clips.refresh()
        }}
      />
    </Screen>
  )
}

/**
 * 클립 한 개 수정 — 업로드본은 파일을 바꿀 수 없어 제목만, 링크는 주소도 받습니다.
 *
 * ★ 지우고 다시 올리는 것만 되던 걸(추가만, 수정 없음) 그 자리에서 고칠 수 있게
 *   합니다. 링크를 바꾸면 썸네일도 새 주소에서 다시 뽑습니다.
 *
 * ★ 시트가 열려 있는 동안에는 clip 이 그대로지만, 닫히는 애니메이션 중에는 부모가
 *   editing 을 이미 null 로 지웠을 수 있습니다. 그래서 clip 이 null 이어도 마지막
 *   값을 기억해뒀다가 그걸로 계속 그립니다.
 */
function ClipEditSheet({
  clip,
  onClose,
  onSaved,
}: {
  clip: Clip | null
  onClose: () => void
  onSaved: () => void
}) {
  const [last, setLast] = useState<Clip | null>(null)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  if (clip && clip.id !== last?.id) {
    setLast(clip)
    setUrl(clip.url)
    setTitle(clip.title)
    setError(undefined)
  }

  const target = clip ?? last
  if (!target) return null

  const save = async () => {
    let nextUrl = target.url
    let nextThumb: string | null | undefined = undefined
    if (target.kind === 'link') {
      const trimmed = url.trim()
      const invalid = validateClipUrl(trimmed)
      if (invalid) {
        setError(invalid)
        return
      }
      nextUrl = trimmed
      nextThumb = clipThumbnail(trimmed)
    }
    setError(undefined)
    setBusy(true)
    const err = await updateClip(target.id, {
      url: nextUrl,
      title: title.trim(),
      ...(nextThumb !== undefined ? { thumbUrl: nextThumb } : {}),
    })
    setBusy(false)
    if (err) {
      toast('고치지 못했어요', 'error', err)
      return
    }
    toast('클립을 고쳤어요')
    onSaved()
  }

  return (
    <BottomSheet
      open={clip !== null}
      onClose={onClose}
      title="클립 수정"
      footer={
        <Button variant="brand" full loading={busy} onClick={() => void save()}>
          저장하기
        </Button>
      }
    >
      {target.kind === 'link' && (
        <div className="mb-2.5">
          <TextInput
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(undefined)
            }}
            placeholder="유튜브·인스타 주소"
          />
        </div>
      )}
      <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (선택)" />
      {error && <p className="mt-1.5 text-2xs font-semibold text-danger">{error}</p>}
    </BottomSheet>
  )
}
