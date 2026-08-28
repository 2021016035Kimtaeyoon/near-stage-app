import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip, Toggle } from '@/components/ui/Chip'
import { Label } from '@/components/ui/Field'
import { WEEKDAY_LABELS, minToHm } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Weekday } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  venueId: string
  /** 빈 셀을 탭했을 때 미리 채워줄 값 */
  defaultWeekday: Weekday
  defaultStartMin: number
  defaultEndMin: number
}

/** 정기 슬롯 등록 폼 — "매주 수요일 20:00~22:00" 같은 반복 규칙을 만듭니다 */
export function AddSlotSheet({ open, onClose, venueId, defaultWeekday, defaultStartMin, defaultEndMin }: Props) {
  const addSlot = useAppStore((s) => s.addSlot)
  const [weekday, setWeekday] = useState<Weekday>(defaultWeekday)
  const [start, setStart] = useState(minToHm(defaultStartMin))
  const [end, setEnd] = useState(minToHm(defaultEndMin))
  const [recurring, setRecurring] = useState(true)

  useEffect(() => {
    if (open) {
      setWeekday(defaultWeekday)
      setStart(minToHm(defaultStartMin))
      setEnd(minToHm(defaultEndMin))
    }
  }, [open, defaultWeekday, defaultStartMin, defaultEndMin])

  const submit = () => {
    if (start >= end) {
      toast('종료 시간은 시작 시간보다 늦어야 해요', 'error')
      return
    }
    addSlot(venueId, { weekday, start, end, recurring, open: true, bookedShowId: null })
    toast(
      `${recurring ? '매주 ' : ''}${WEEKDAY_LABELS[weekday]}요일 ${start}~${end} 슬롯을 열었습니다`,
      'success',
    )
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="가능 시간 추가"
      subtitle="공연자가 이 시간에 지원할 수 있게 됩니다"
      footer={
        <Button full variant="brand" onClick={submit}>
          이 시간 열기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>요일</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((d, i) => (
              <Chip key={d} active={weekday === i} onClick={() => setWeekday(i as Weekday)}>
                {d}
              </Chip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>시작 시간</Label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
          <div>
            <Label>종료 시간</Label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <Toggle
            checked={recurring}
            onChange={setRecurring}
            label="매주 반복"
            hint={`끄면 이번 주 ${WEEKDAY_LABELS[weekday]}요일 한 번만 열립니다`}
          />
        </div>
      </div>
    </BottomSheet>
  )
}
