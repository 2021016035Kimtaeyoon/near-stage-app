import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Label } from '@/components/ui/Field'
import { addSlots, type Slot } from '@/hooks/useSlots'
import { WEEKDAY_LABELS } from '@/lib/datetime'
import { toast } from '@/store/useToast'

const REPEAT_OPTIONS = [1, 2, 4, 8] as const

function todayInput(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

/** "2026-09-12" + "20:00" → 그 지역 시각의 Date */
function localDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

/**
 * 가능 시간 추가 (§10).
 *
 * ★ 요일 반복 규칙을 저장하지 않고, 그 자리에서 몇 주치 행을 실제로 만듭니다.
 *   규칙만 저장하면 "그 주는 사정이 있어 못 해요"를 표현할 방법이 없습니다.
 *   만든 뒤에는 한 주씩 따로 닫을 수 있습니다.
 */
export function SlotSheet({
  open,
  onClose,
  venueId,
  existing,
  onDone,
}: {
  open: boolean
  onClose: () => void
  venueId: string
  existing: Slot[]
  onDone: () => void
}) {
  const [date, setDate] = useState(todayInput())
  const [start, setStart] = useState('20:00')
  const [end, setEnd] = useState('22:00')
  const [repeat, setRepeat] = useState<number>(1)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setDate(todayInput())
      setRepeat(1)
    }
  }, [open])

  const startAt = localDateTime(date, start)
  const endAt = localDateTime(date, end)
  const weekday = WEEKDAY_LABELS[startAt.getDay()]

  const submit = async () => {
    if (!(endAt.getTime() > startAt.getTime())) {
      toast('종료 시각이 시작보다 빨라요', 'error', '자정을 넘기는 공연은 다음 날로 나눠 등록해주세요')
      return
    }
    setBusy(true)
    const r = await addSlots(venueId, startAt, endAt, repeat, existing)
    setBusy(false)
    if (r.error) {
      toast('추가하지 못했어요', 'error', r.error)
      return
    }
    if (r.created === 0) {
      toast('이미 등록된 시간이에요', 'warn', '같은 날 같은 시각에는 하나만 열 수 있습니다')
      return
    }
    toast(
      `${r.created}개 시간을 열었어요`,
      'success',
      r.skipped > 0 ? `${r.skipped}개는 이미 등록되어 있어 건너뛰었습니다` : undefined,
    )
    onDone()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="가능 시간 추가"
      subtitle="이 시간에 공연팀이 지원할 수 있게 됩니다"
      footer={
        <Button full variant="brand" loading={busy} onClick={() => void submit()}>
          이 시간 열기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label hint={`${weekday}요일`}>날짜</Label>
          <input
            type="date"
            value={date}
            min={todayInput()}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>시작</Label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
          <div>
            <Label>종료</Label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <Label hint="같은 요일·시각으로 한 번에 만듭니다">반복</Label>
          <div className="flex flex-wrap gap-1.5">
            {REPEAT_OPTIONS.map((w) => (
              <Chip key={w} active={repeat === w} onClick={() => setRepeat(w)}>
                {w === 1 ? '이 날만' : `${w}주`}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
            {repeat === 1
              ? '하루만 엽니다.'
              : `${weekday}요일 ${start}에 ${repeat}주 동안 엽니다. 만든 뒤에 한 주씩 따로 닫을 수 있어요.`}
          </p>
        </div>
      </div>
    </BottomSheet>
  )
}
