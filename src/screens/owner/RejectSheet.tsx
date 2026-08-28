import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Application, Post } from '@/types'

const REASONS = [
  '희망 일정이 맞지 않음',
  '장비 조건이 맞지 않음',
  '원하는 장르가 아님',
  '예산(개런티)이 맞지 않음',
  '이미 다른 팀과 확정됨',
]

export function RejectSheet({
  open,
  onClose,
  post,
  application,
}: {
  open: boolean
  onClose: () => void
  post: Post
  application: Application
}) {
  const rejectApplication = useAppStore((s) => s.rejectApplication)
  const [reason, setReason] = useState(REASONS[0])

  const submit = () => {
    rejectApplication(post.id, application.id, reason)
    toast('지원을 거절했습니다', 'default', '사유가 공연자에게 전달됩니다')
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="지원 거절"
      subtitle="사유를 선택하면 공연자에게 전달됩니다"
      footer={
        <Button full variant="danger" onClick={submit}>
          거절하기
        </Button>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
            {r}
          </Chip>
        ))}
      </div>
    </BottomSheet>
  )
}
