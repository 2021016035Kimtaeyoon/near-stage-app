import { CalendarPlus, Info } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { acceptApplication } from '@/hooks/useAccept'
import type { Applicant } from '@/hooks/useApplications'
import { useSlots } from '@/hooks/useSlots'
import { WEEKDAY_LABELS } from '@/lib/datetime'
import { toast } from '@/store/useToast'

function slotLabel(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  const hm = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${s.getMonth() + 1}월 ${s.getDate()}일 (${WEEKDAY_LABELS[s.getDay()]}) ${hm(s)}–${hm(e)}`
}

/**
 * 수락 — 언제 할지 고르면 공연이 만들어집니다 (§11).
 *
 * 슬롯을 고르게 하는 이유: 구인글은 "이 기간 중에"라고만 적혀 있어서, 실제 날짜는
 * 여기서 정해집니다. 이미 공연이 잡혔거나 닫아둔 시간은 아예 보여주지 않습니다.
 */
export function AcceptSheet({
  open,
  onClose,
  applicant,
  venueId,
  onDone,
}: {
  open: boolean
  onClose: () => void
  applicant: Applicant | null
  venueId: string | null
  onDone: () => void
}) {
  const navigate = useNavigate()
  const slots = useSlots(open ? venueId : null)
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const usable = slots.data.filter((s) => s.isOpen && !s.lockedByShowId)

  const submit = async () => {
    if (!applicant || !picked) return
    setBusy(true)
    const { showId, error } = await acceptApplication(applicant.id, picked)
    setBusy(false)
    if (error) {
      toast('수락하지 못했어요', 'error', error)
      return
    }
    toast('공연이 만들어졌어요', 'success', '지도와 목록에 바로 올라갑니다')
    onDone()
    onClose()
    if (showId) navigate(`/audience/show/${showId}`)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="언제 할까요"
      subtitle={applicant ? `${applicant.artist.teamName} · ${applicant.artist.durationMin}분` : ''}
      footer={
        usable.length > 0 ? (
          <Button full variant="brand" loading={busy} disabled={!picked} onClick={() => void submit()}>
            {picked ? '이 시간으로 공연 확정' : '시간을 골라주세요'}
          </Button>
        ) : undefined
      }
    >
      {slots.loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : usable.length === 0 ? (
        <EmptyState
          art="stage"
          title="열려 있는 시간이 없어요"
          description="공연할 시간을 먼저 열어야 확정할 수 있습니다. 이미 공연이 잡혔거나 닫아둔 시간은 여기에 나오지 않습니다."
          action={
            venueId && (
              <Button
                variant="brand"
                leading={<CalendarPlus size={16} />}
                onClick={() => {
                  onClose()
                  navigate(`/host/venue/${venueId}/slots`)
                }}
              >
                가능 시간 열기
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {usable.map((s) => (
            <button
              key={s.id}
              onClick={() => setPicked(s.id)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-colors ${
                picked === s.id
                  ? 'bg-gold-500 border-transparent text-gold-ink'
                  : 'border-border bg-surface active:bg-surface-2'
              }`}
            >
              <span className="tnum flex-1">{slotLabel(s.startsAt, s.endsAt)}</span>
            </button>
          ))}

          <p className="flex items-start gap-1.5 pt-2 text-2xs leading-relaxed text-ink-3">
            <Info size={11} className="mt-0.5 shrink-0" />
            확정하면 이 구인글은 마감되고, 같은 글에 지원한 다른 팀은 자동으로 거절됩니다. 공연은
            바로 지도와 목록에 올라갑니다. 개런티는 팀과 직접 정하고 현장에서 정산하세요.
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
