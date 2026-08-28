import { CheckCircle2, CreditCard, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Field'
import { PLATFORM_FEE } from '@/config/brand'
import { kstIso, won } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Application, Performer, Post } from '@/types'

type Step = 'pick' | 'pay' | 'paying' | 'done'

function todayInput(nowIso: string): string {
  return nowIso.slice(0, 10)
}

/**
 * ★ 지원 수락 플로우 — 일시 확정 → 매칭 수수료 10,000원 결제 → 공연 확정.
 * 확정되는 즉시 store의 acceptApplication이 관객 지도용 Show를 만들고
 * demo.highlightShowId를 세팅해 지도에 새 핀이 뜰 준비를 합니다.
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
  const nowIso = useAppStore((s) => s.demoNowIso)
  const acceptApplication = useAppStore((s) => s.acceptApplication)

  const [step, setStep] = useState<Step>('pick')
  const [date, setDate] = useState(todayInput(nowIso))
  const [time, setTime] = useState('20:00')

  const close = () => {
    setStep('pick')
    onClose()
  }

  const confirmPay = () => {
    setStep('paying')
    window.setTimeout(() => {
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
    }, 1800)
  }

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={step === 'done' ? '공연이 확정되었어요' : '지원 수락'}
      subtitle={step === 'done' ? undefined : `${performer.teamName}의 지원을 수락합니다`}
      footer={
        step === 'pick' ? (
          <Button full variant="brand" onClick={() => setStep('pay')}>
            다음 · 매칭 수수료 결제
          </Button>
        ) : step === 'pay' || step === 'paying' ? (
          <Button full variant="brand" loading={step === 'paying'} onClick={confirmPay}>
            {step === 'paying' ? '결제 처리 중' : `${won(PLATFORM_FEE)}원 결제하고 확정하기`}
          </Button>
        ) : (
          <Button full variant="brand" onClick={() => { close(); navigate('/owner/dashboard') }}>
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
        </div>
      )}

      {(step === 'pay' || step === 'paying') && (
        <div>
          <div
            className="relative mb-4 flex h-40 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white"
            style={{ backgroundImage: 'linear-gradient(135deg,#2A2A38 0%,#17171C 100%)' }}
          >
            <div className="flex items-center justify-between">
              <CreditCard size={20} />
              <span className="text-2xs font-bold tracking-wide opacity-80">MOCK CARD</span>
            </div>
            <p className="tnum text-lg font-bold tracking-[0.18em]">•••• •••• •••• 8899</p>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-2">매칭 수수료</span>
              <span className="tnum font-bold">{won(PLATFORM_FEE)}원</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-2">공연 확정 일시</span>
              <span className="tnum font-semibold">
                {date} {time}
              </span>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="brand-gradient flex h-14 w-14 items-center justify-center rounded-full text-white">
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
