import { Lock, Plus } from 'lucide-react'
import { Fragment } from 'react'
import { hmToMin, WEEKDAY_LABELS } from '@/lib/datetime'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { TimeSlot, Weekday } from '@/types'

interface Band {
  key: string
  label: string
  startMin: number
  endMin: number
}

/** 하루를 4개 시간대로 나눠 요일 × 시간대 그리드를 만듭니다 */
const BANDS: Band[] = [
  { key: 'morning', label: '아침\n06-12', startMin: 6 * 60, endMin: 12 * 60 },
  { key: 'afternoon', label: '낮\n12-17', startMin: 12 * 60, endMin: 17 * 60 },
  { key: 'evening', label: '저녁\n17-21', startMin: 17 * 60, endMin: 21 * 60 },
  { key: 'night', label: '심야\n21-24', startMin: 21 * 60, endMin: 24 * 60 },
]

function slotBand(slot: TimeSlot): Band | null {
  const start = hmToMin(slot.start)
  return BANDS.find((b) => start >= b.startMin && start < b.endMin) ?? null
}

interface Props {
  venueId: string
  slots: TimeSlot[]
  onEmptyCellTap: (weekday: Weekday, band: Band) => void
}

/**
 * 주간 캘린더 그리드 (요일 × 시간대).
 * ★ 이미 공연이 확정된 슬롯(bookedShowId 있음)은 잠금 처리되어 탭해도 열고 닫을 수 없습니다.
 */
export function WeeklySlotGrid({ venueId, slots, onEmptyCellTap }: Props) {
  const toggleSlotOpen = useAppStore((s) => s.toggleSlotOpen)

  const cellFor = (weekday: Weekday, band: Band): TimeSlot | undefined =>
    slots.find((s) => s.weekday === weekday && slotBand(s)?.key === band.key)

  const handleTap = (slot: TimeSlot | undefined, weekday: Weekday, band: Band) => {
    if (!slot) {
      onEmptyCellTap(weekday, band)
      return
    }
    if (slot.bookedShowId) {
      toast('이미 공연이 확정된 슬롯입니다', 'warn', '슬롯을 닫으려면 공연 종료 후 다시 시도하세요')
      return
    }
    toggleSlotOpen(venueId, slot.id)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
          <div />
          {WEEKDAY_LABELS.map((d, i) => (
            <div key={i} className="pb-1 text-center text-2xs font-bold text-ink-3">
              {d}
            </div>
          ))}

          {BANDS.map((band) => (
            <Fragment key={band.key}>
              <div className="flex items-center whitespace-pre-line text-center text-[9px] font-semibold leading-tight text-ink-3">
                {band.label}
              </div>
              {WEEKDAY_LABELS.map((_, weekdayIdx) => {
                const weekday = weekdayIdx as Weekday
                const slot = cellFor(weekday, band)
                const booked = !!slot?.bookedShowId
                const open = slot?.open ?? false
                return (
                  <button
                    key={`${band.key}-${weekday}`}
                    onClick={() => handleTap(slot, weekday, band)}
                    className={cn(
                      'flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border text-[9px] font-bold transition-colors',
                      !slot && 'border-dashed border-border text-ink-3 active:bg-surface-2',
                      slot &&
                        booked &&
                        'border-border-strong bg-surface-2 text-ink-3',
                      slot &&
                        !booked &&
                        open &&
                        'bg-gold-500 border-transparent text-gold-ink',
                      slot &&
                        !booked &&
                        !open &&
                        'border-border bg-surface text-ink-3 line-through decoration-1',
                    )}
                  >
                    {!slot && <Plus size={12} />}
                    {slot && booked && <Lock size={11} />}
                    {slot && (
                      <span className="tnum">
                        {slot.start}
                        {'\n'}
                        {slot.end}
                      </span>
                    )}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-2xs text-ink-3">
        <Legend swatchClass="bg-gold-500" label="열림" />
        <Legend swatchClass="border border-border bg-surface" label="닫힘" />
        <Legend swatchClass="border border-border-strong bg-surface-2" label="공연 확정 (잠금)" />
        <Legend swatchClass="border border-dashed border-border" label="빈 슬롯 · 탭해서 추가" />
      </div>
    </div>
  )
}

function Legend({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded', swatchClass)} />
      {label}
    </span>
  )
}
