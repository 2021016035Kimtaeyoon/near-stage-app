import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Label, TextArea } from '@/components/ui/Field'
import type { MyPost } from '@/hooks/usePosts'
import { sendInvite } from '@/hooks/usePostInvites'
import type { PublicArtist } from '@/hooks/usePublicArtists'
import { priceLabel } from '@/lib/datetime'
import { toast } from '@/store/useToast'

/**
 * 팀을 우리 구인글로 초대 (§10).
 *
 * ★ 채팅을 열지 않습니다. 공연이 확정되기 전에 자유 대화를 열면 개런티 협상이나
 *   연락처 교환이 플랫폼 밖에서 일어납니다. 초대는 정해진 구인글 + 짧은 메시지
 *   하나만 보냅니다. 아티스트가 마음에 들면 정식으로 지원을 눌러 진행됩니다.
 */
export function InviteToPostSheet({
  open,
  onClose,
  artist,
  posts,
  onDone,
}: {
  open: boolean
  onClose: () => void
  artist: PublicArtist | null
  /** 열려 있는 내 구인글만 넘겨주세요 */
  posts: MyPost[]
  onDone: () => void
}) {
  const [postId, setPostId] = useState(posts[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const target = posts.find((p) => p.id === postId) ?? posts[0]

  const submit = async () => {
    if (!artist || !target) return
    setBusy(true)
    const err = await sendInvite(target.id, artist.id, message.trim())
    setBusy(false)
    if (err) {
      toast('초대하지 못했어요', 'error', err)
      return
    }
    toast('초대했어요', 'success', `${artist.teamName}에게 알림이 갑니다`)
    setMessage('')
    onDone()
    onClose()
  }

  if (posts.length === 0) {
    return (
      <BottomSheet open={open} onClose={onClose} title="초대하려면 구인글이 필요해요">
        <p className="text-sm leading-relaxed text-ink-2">
          아직 열려 있는 구인글이 없어요. 구인 탭에서 먼저 글을 올려주세요 — 초대는 어느
          구인글로 오라는 것인지가 있어야 아티스트가 판단할 수 있습니다.
        </p>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="이 팀 초대하기"
      subtitle={artist?.teamName}
      footer={
        <Button full variant="brand" loading={busy} onClick={() => void submit()}>
          초대 보내기
        </Button>
      }
    >
      <div className="space-y-4">
        {posts.length > 1 && (
          <div>
            <Label>어느 구인글로 초대할까요</Label>
            <div className="flex flex-wrap gap-1.5">
              {posts.map((p) => (
                <Chip key={p.id} active={target?.id === p.id} onClick={() => setPostId(p.id)}>
                  {p.wantedGenres.join('·') || '장르 상관없음'} · {priceLabel(p.offerFee)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {artist && artist.needs.length > 0 && (
          <div className="rounded-xl border border-border p-3">
            <p className="mb-1.5 text-2xs font-bold text-ink-2">이 팀이 필요하다고 적은 것</p>
            <p className="text-2xs leading-relaxed text-ink-3">{artist.needs.join(' · ')}</p>
          </div>
        )}

        <div>
          <Label hint="이 팀이 이 메시지를 보고 지원할지 결정합니다">하고 싶은 말</Label>
          <TextArea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예) 홍대 라이브 영상 잘 봤어요. 저희 공간과 잘 맞을 것 같아 구인글을 올렸는데, 한번 봐주시겠어요?"
            maxLength={500}
          />
        </div>

        <p className="text-2xs leading-relaxed text-ink-3">
          개런티는 팀과 직접 정하고 공연 당일 현장에서 정산합니다. 이 앱은 대금에 관여하지
          않습니다.
        </p>
      </div>
    </BottomSheet>
  )
}
