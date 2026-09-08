import { useState } from 'react'
import { CenterModal } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label, TextArea } from '@/components/ui/Field'
import { cancelShow } from '@/hooks/useVenueStats'
import { toast } from '@/store/useToast'

/**
 * 공연 취소 (호스트·아티스트 양쪽).
 *
 * ★ 사유를 반드시 받습니다. 참석 예정을 눌러둔 관객에게 그대로 갑니다 —
 *   "취소되었습니다"만 오면 왜인지 알 수 없어서 다시는 안 옵니다.
 *
 * ★ 무엇이 함께 일어나는지 먼저 다 적습니다. 취소는 되돌릴 수 없고, 상대방과
 *   관객에게 알림이 나갑니다.
 */
export function ShowCancelModal({
  open,
  onClose,
  showId,
  showTitle,
  goingCount,
  onDone,
}: {
  open: boolean
  onClose: () => void
  showId: string
  showTitle: string
  goingCount: number
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!reason.trim()) {
      toast('취소 사유를 적어주세요', 'warn', '참석 예정인 분들께 그대로 전달됩니다')
      return
    }
    setBusy(true)
    const err = await cancelShow(showId, reason.trim())
    setBusy(false)
    if (err) {
      toast('취소하지 못했어요', 'error', err)
      return
    }
    toast('공연을 취소했어요', 'success', '상대방과 참석 예정인 분들께 알렸습니다')
    setReason('')
    onDone()
    onClose()
  }

  return (
    <CenterModal open={open} onClose={onClose} title="공연을 취소할까요?">
      <p className="text-[13px] leading-relaxed text-ink-2">
        <b>{showTitle}</b>
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {[
          goingCount > 0
            ? `참석 예정인 ${goingCount}명에게 사유가 그대로 전달됩니다`
            : '참석 예정인 분이 아직 없습니다',
          '상대방(호스트 또는 아티스트)에게도 알림이 갑니다',
          '그 시간이 다시 열려서 다른 공연을 잡을 수 있습니다',
          '지도와 목록에서 사라집니다',
        ].map((t) => (
          <li key={t} className="flex gap-2 text-2xs leading-relaxed text-ink-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-2xs leading-relaxed text-ink-3">
        되돌릴 수 없습니다. 다시 하려면 새로 매칭해야 합니다.
      </p>

      <div className="mt-4">
        <Label hint="참석 예정인 분들께 그대로 보입니다">취소 사유</Label>
        <TextArea
          autoFocus
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예) 아티스트 건강 문제로 부득이하게 취소합니다. 죄송합니다."
          maxLength={200}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" full onClick={onClose}>
          그대로 두기
        </Button>
        <Button variant="danger" full loading={busy} onClick={() => void run()}>
          취소합니다
        </Button>
      </div>
    </CenterModal>
  )
}
