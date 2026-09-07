import { Paperclip } from 'lucide-react'
import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Chip'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Post } from '@/types'

/** 구인글 지원 폼 — 메시지 + 포트폴리오(클립) 첨부 */
export function ApplyToPostSheet({
  open,
  onClose,
  post,
  venueName,
}: {
  open: boolean
  onClose: () => void
  post: Post | null
  venueName: string
}) {
  const performerId = useAppStore((s) => s.currentPerformerId)
  const applyToPost = useAppStore((s) => s.applyToPost)
  const [message, setMessage] = useState('')
  const [attachClips, setAttachClips] = useState(true)

  const submit = () => {
    if (!post || !performerId) return
    if (!message.trim()) {
      toast('지원 메시지를 입력해주세요', 'error')
      return
    }
    applyToPost(
      post.id,
      performerId,
      attachClips ? `${message.trim()} (클립 포트폴리오 첨부됨)` : message.trim(),
    )
    toast('지원이 완료되었습니다', 'success', `${venueName}에 알림이 전송됐어요`)
    setMessage('')
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="지원하기"
      subtitle={`${venueName}에 지원합니다`}
      footer={
        <Button full variant="brand" onClick={submit}>
          지원 보내기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <TextArea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="간단한 소개와 가능한 일정을 적어주세요"
          />
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <Toggle
            checked={attachClips}
            onChange={setAttachClips}
            label="포트폴리오 클립 첨부"
            hint="내 프로필의 클립을 함께 보여줍니다"
          />
        </div>
        {attachClips && (
          <p className="flex items-center gap-1.5 text-2xs text-ink-3">
            <Paperclip size={12} /> 클립 3개가 자동으로 첨부됩니다
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
