import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label, TextArea, TextInput } from '@/components/ui/Field'
import { saveShowReport, type VenueShow } from '@/hooks/useVenueStats'
import { toast } from '@/store/useToast'

/**
 * 공연이 끝난 뒤 실제로 몇 분이 오셨는지 적는 시트 (§14).
 *
 * ★ 이 숫자가 없으면 성과 리포트가 성립하지 않습니다. 참석 예정은 "오겠다고 누른
 *   사람"이고, 실제로 온 사람과는 늘 다릅니다. 그 차이를 아는 건 가게 사장님뿐입니다.
 *
 * ★ 비워두면 저장하지 않습니다. 모르면 0 을 넣게 만들면 "손님이 안 왔다"는 기록이
 *   남고, 그 숫자가 다음 아티스트에게 보입니다.
 */
export function ShowReportSheet({
  show,
  open,
  onClose,
  onDone,
}: {
  show: VenueShow | null
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const [count, setCount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && show) {
      setCount(show.visitorCount !== null ? String(show.visitorCount) : '')
      setNote(show.reportNote)
    }
  }, [open, show])

  const submit = async () => {
    if (!show) return
    if (count.trim() === '') {
      toast('오신 분 수를 적어주세요', 'warn', '기억나는 대로 대략이어도 괜찮습니다')
      return
    }
    const n = Number(count)
    if (!Number.isFinite(n) || n < 0) {
      toast('숫자로 적어주세요', 'error')
      return
    }
    setBusy(true)
    const err = await saveShowReport(show.id, Math.round(n), note.trim())
    setBusy(false)
    if (err) {
      toast('저장하지 못했어요', 'error', err)
      return
    }
    toast('기록했어요', 'success', '성과 리포트에 반영됩니다')
    onDone()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="그날 몇 분이 오셨나요"
      subtitle={show?.title}
      footer={
        <Button full variant="brand" loading={busy} onClick={() => void submit()}>
          기록하기
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="tnum text-2xs leading-relaxed text-ink-2">
            앱에서 참석 예정을 누른 분은 <b>{show?.goingCount ?? 0}명</b>이었습니다. 실제로는
            더 오시기도, 덜 오시기도 합니다 — 그 차이를 아는 건 사장님뿐이에요.
          </p>
        </div>

        <div>
          <Label hint="공연을 보러 온 손님 수. 대략이어도 괜찮습니다">실제 방문객 (명)</Label>
          <TextInput
            type="number"
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="예) 24"
            min={0}
            autoFocus
          />
        </div>

        <div>
          <Label hint="다음에 참고할 메모. 아티스트에게는 보이지 않습니다">메모 (선택)</Label>
          <TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예) 비가 와서 예상보다 적었음. 8시 시작이 딱 좋았음."
            maxLength={300}
          />
        </div>
      </div>
    </BottomSheet>
  )
}
