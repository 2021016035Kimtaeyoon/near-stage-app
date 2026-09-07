import { CheckCircle2, HandCoins, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Field'
import { FEE_DISCLAIMER } from '@/config/brand'
import { kstIso } from '@/lib/datetime'
import { useAppStore, useNow } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Application, Performer, Post } from '@/types'

type Step = 'pick' | 'done'

function todayInput(nowIso: string): string {
  return nowIso.slice(0, 10)
}

/**
 * ★ 지원 수락 — 일시를 고르고 바로 확정합니다. 결제 단계는 없습니다.
 *
 * 확정되는 즉시 acceptApplication이 공연을 만들고 highlightShowId를 세팅해
 * 관객 지도에 새 핀이 뜰 준비를 합니다.
 */
export function AcceptSheet({
  open,
  onClose,
  post,
  application,
  performer,
}: {
  open: boolean
  onClose: () => void
  post: Post
  application: Application
  performer: Performer
}) {
  const navigate = useNavigate()
  const nowIso = useNow()
  const acceptApplication = useAppStore((s) => s.acceptApplication)

  const [step, setStep] = useState<Step>('pick')
  const [date, setDate] = useState(todayInput(nowIso))
  const [time, setTime] = useState('20:00')

  const close = () => {
    setStep('pick')
    onClose()
  }

  const confirm = () => {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    const startAt = kstIso(y, m, d, hh, mm)
    const result = acceptApplication(post.id, application.id, startAt)
    if (!result) {
      toast('공연 확정에 실패했습니다', 'error')
      close()
      return
    }
    setStep('done')
  }

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={step === 'done' ? '공연이 확정되었어요' : '지원 수락'}
      subtitle={step === 'done' ? undefined : `${performer.teamName}의 지원을 수락합니다`}
      footer={
        step === 'pick' ? (
          <Button full variant="brand" onClick={confirm}>
            수락하기
          </Button>
        ) : (
          <Button
            full
            variant="brand"
            onClick={() => {
              close()
              navigate('/owner/dashboard')
            }}
          >
            대시보드로 이동
          </Button>
        )
      }
    >
      {step === 'pick' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>공연 날짜</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
              />
            </div>
            <div>
              <Label>시작 시간</Label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
              />
            </div>
          </div>
          <p className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
            확정 즉시 관객 지도에 공연이 노출됩니다. 구인글은 자동으로 마감 처리됩니다.
          </p>
          <div className="flex items-start gap-2 rounded-xl border border-border p-3.5 text-xs leading-relaxed text-ink-2">
            <HandCoins size={15} className="mt-0.5 shrink-0 text-gold-text" />
            <p>{FEE_DISCLAIMER}</p>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="bg-gold-500 flex h-14 w-14 items-center justify-center rounded-full text-gold-ink">
            <CheckCircle2 size={28} />
          </div>
          <p className="mt-3 text-sm font-bold">{performer.teamName} 공연이 확정되었어요</p>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-2">
            <MapPin size={12} /> 관객 지도에 방금 새 핀이 추가되었습니다
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
