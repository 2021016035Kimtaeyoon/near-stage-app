import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Label, TextArea } from '@/components/ui/Field'
import { useAuthStore } from '@/hooks/useAuth'
import {
  REPORT_REASONS,
  submitReport,
  type ReportReason,
  type ReportTarget,
} from '@/hooks/useReports'
import { toast } from '@/store/useToast'

const TARGET_LABEL: Record<ReportTarget, string> = {
  venue: '이 공간',
  artist: '이 팀',
  clip: '이 클립',
  comment: '이 댓글',
  show: '이 공연',
}

/**
 * 신고 시트 (§16).
 *
 * ★ 신고한 사람이 누구인지 신고당한 쪽에 알리지 않습니다. 그 사실을 화면에도
 *   적어둡니다 — 보복이 걱정되면 아무도 신고하지 않고, 그러면 신고 기능이
 *   있으나 마나입니다.
 */
export function ReportSheet({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean
  onClose: () => void
  targetType: ReportTarget
  targetId: string
}) {
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setReason(null)
      setDetail('')
    }
  }, [open])

  const submit = () => {
    if (!reason) {
      toast('신고 이유를 골라주세요', 'warn')
      return
    }
    requireAuth(async () => {
      setBusy(true)
      const err = await submitReport({ targetType, targetId, reason, detail: detail.trim() })
      setBusy(false)
      if (err) {
        toast('접수하지 못했어요', 'error', err)
        return
      }
      toast('신고를 접수했어요', 'success', '운영자가 확인한 뒤 결과를 알려드립니다')
      onClose()
    })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`${TARGET_LABEL[targetType]} 신고`}
      subtitle="운영자가 확인한 뒤 조치합니다"
      footer={
        <Button full variant="danger" loading={busy} onClick={submit}>
          신고 접수
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>어떤 문제인가요</Label>
          <div className="flex flex-wrap gap-1.5">
            {REPORT_REASONS.map((r) => (
              <Chip key={r.value} active={reason === r.value} onClick={() => setReason(r.value)}>
                {r.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label hint="구체적으로 적어주시면 확인이 빠릅니다">자세한 내용 (선택)</Label>
          <TextArea
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="어떤 부분이 문제인지 적어주세요."
            maxLength={500}
          />
        </div>

        <p className="rounded-xl bg-surface-2 p-3 text-2xs leading-relaxed text-ink-2">
          신고 내용은 운영자만 봅니다. <b>신고당한 쪽에게 누가 신고했는지 알리지
          않습니다.</b> 다만 허위 신고를 반복하면 신고 기능 이용이 제한될 수 있어요.
        </p>
      </div>
    </BottomSheet>
  )
}
