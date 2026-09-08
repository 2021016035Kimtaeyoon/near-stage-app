import { CheckCircle2, CircleHelp, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Label, TextArea } from '@/components/ui/Field'
import { applyToPost } from '@/hooks/useApplications'
import type { MyArtist } from '@/hooks/useMyResources'
import type { OpenPost } from '@/hooks/usePosts'
import { matchNeeds } from '@/lib/needMatch'
import { toast } from '@/store/useToast'

/**
 * 구인글에 지원 (§10).
 *
 * 지원 전에 ★ 장비 대조 결과를 먼저 보여줍니다. 부족한 항목을 모르고 지원했다가
 * 공연 당일에 알게 되는 게 가장 나쁩니다. 부족해도 지원은 막지 않습니다 —
 * 대여하거나 빼고 진행하는 경우가 많아서, 결정은 팀이 합니다.
 */
export function ApplyToPostSheet({
  open,
  onClose,
  post,
  artists,
  needs,
  onDone,
}: {
  open: boolean
  onClose: () => void
  post: OpenPost | null
  /** 승인된 내 팀 */
  artists: MyArtist[]
  /** 팀 id → 필요 장비 */
  needs: Record<string, string[]>
  onDone: () => void
}) {
  const [artistId, setArtistId] = useState(artists[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const target = artists.find((a) => a.id === artistId) ?? artists[0]
  const match = post && target ? matchNeeds(needs[target.id] ?? [], post.venue.equipment) : null

  const submit = async () => {
    if (!post || !target) return
    if (!message.trim()) {
      toast('하고 싶은 말을 적어주세요', 'warn', '호스트는 이 글을 보고 수락을 결정합니다')
      return
    }
    setBusy(true)
    const err = await applyToPost(post.id, target.id, message.trim())
    setBusy(false)
    if (err) {
      toast('지원하지 못했어요', 'error', err)
      return
    }
    toast('지원했어요', 'success', '호스트가 확인하면 알림이 갑니다')
    setMessage('')
    onDone()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="이 공간에 지원"
      subtitle={post?.venue.name}
      footer={
        <Button full variant="brand" loading={busy} onClick={() => void submit()}>
          지원하기
        </Button>
      }
    >
      <div className="space-y-4">
        {artists.length > 1 && (
          <div>
            <Label>어느 팀으로 지원할까요</Label>
            <div className="flex flex-wrap gap-1.5">
              {artists.map((a) => (
                <Chip key={a.id} active={target?.id === a.id} onClick={() => setArtistId(a.id)}>
                  {a.teamName}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {match && (
          <div className="rounded-xl border border-border p-3">
            <p className="mb-2 text-2xs font-bold text-ink-2">
              이 공간이 우리 조건을 맞추는지 · {match.okCount}/{match.judgedCount} 충족
            </p>
            {match.checks.length === 0 ? (
              <p className="text-2xs leading-relaxed text-ink-3">
                팀 등록에 필요한 장비를 적지 않으셨습니다. 적어두면 이렇게 미리 대조해 드립니다.
              </p>
            ) : (
              <div className="space-y-1.5">
                {match.checks.map((c) => (
                  <div key={c.label} className="flex items-center justify-between gap-2 text-2xs">
                    <span className="min-w-0 truncate text-ink-2">{c.label}</span>
                    <span
                      className={`flex shrink-0 items-center gap-1 font-semibold ${
                        c.ok === true ? 'text-ok' : c.ok === false ? 'text-warn' : 'text-ink-3'
                      }`}
                    >
                      {c.ok === true ? (
                        <CheckCircle2 size={12} />
                      ) : c.ok === false ? (
                        <TriangleAlert size={12} />
                      ) : (
                        <CircleHelp size={12} />
                      )}
                      {c.actual || '직접 확인'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {match.missingCount > 0 && (
              <p className="mt-2 text-2xs leading-relaxed text-warn">
                부족한 항목이 {match.missingCount}개 있습니다. 지원은 되지만, 아래 메시지에 어떻게
                해결할지 적어두면 수락될 확률이 올라갑니다.
              </p>
            )}
          </div>
        )}

        <div>
          <Label hint="호스트가 이 글을 보고 결정합니다">하고 싶은 말</Label>
          <TextArea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예) 어쿠스틱 2인조입니다. 마이크는 저희가 들고 갈 수 있어요. 60분 공연이고 리허설은 1시간 전이면 충분합니다."
            maxLength={500}
          />
        </div>

        <p className="text-2xs leading-relaxed text-ink-3">
          개런티는 호스트와 직접 정하고 공연 당일 현장에서 정산합니다. 이 앱은 대금에 관여하지
          않습니다.
        </p>
      </div>
    </BottomSheet>
  )
}
