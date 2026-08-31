import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, CreditCard, Info, Minus, Plus, ShieldAlert } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '@/components/shell/ScreenHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PosterArt } from '@/components/ui/PosterArt'
import { DEPOSIT_AMOUNT, SERVICE_NAME } from '@/config/brand'
import { humanDateTime, priceLabel, won } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

type Step = 'count' | 'pay' | 'paying' | 'done'

export function BookingFlow() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const createReservation = useAppStore((s) => s.createReservation)
  const nowIso = useAppStore((s) => s.demoNowIso)

  const [step, setStep] = useState<Step>('count')
  const [headcount, setHeadcount] = useState(1)
  const [reservationId, setReservationId] = useState<string | null>(null)

  const show = shows.find((s) => s.id === showId) ?? null
  const place = show ? resolvePlace(show, venues) : null
  const performer = show?.performerId ? performers.find((p) => p.id === show.performerId) : null

  if (!show || !place) {
    return (
      <Screen>
        <div className="flex items-center gap-2 px-4 pb-3 pt-12">
          <IconButton label="닫기" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </IconButton>
        </div>
        <EmptyState art="ticket" title="예약할 공연을 찾을 수 없어요" />
      </Screen>
    )
  }

  const seatsLeft = Math.max(0, show.capacity - show.reservedCount)
  const deposit = DEPOSIT_AMOUNT * headcount

  const handlePay = () => {
    setStep('paying')
    window.setTimeout(() => {
      const reservation = createReservation(show.id, headcount)
      setReservationId(reservation.id)
      setStep('done')
    }, 2000)
  }

  return (
    <Screen>
      <div className="flex items-center gap-2 border-b border-border px-4 pb-3 pt-12">
        <IconButton
          label="뒤로"
          onClick={() => (step === 'count' ? navigate(-1) : setStep('count'))}
        >
          <ChevronLeft size={22} />
        </IconButton>
        <h1 className="text-[16px] font-bold">
          {step === 'done' ? '예약 완료' : '예약하기'}
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3">
          <PosterArt
            seed={show.id + (performer?.photoSeed ?? show.title)}
            genre={show.genre}
            className="h-14 w-14 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{show.title}</p>
            <p className="tnum mt-0.5 truncate text-xs text-ink-2">
              {humanDateTime(show.startAt, nowIso)} · {place.name}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'count' && (
            <StepCount
              key="count"
              headcount={headcount}
              setHeadcount={setHeadcount}
              seatsLeft={seatsLeft}
              ticketPrice={show.ticketPrice}
            />
          )}
          {(step === 'pay' || step === 'paying') && (
            <StepPay
              key="pay"
              headcount={headcount}
              deposit={deposit}
              paying={step === 'paying'}
            />
          )}
          {step === 'done' && reservationId && (
            <StepDone key="done" reservationId={reservationId} onGoTicket={() => navigate(`/audience/ticket/${reservationId}`, { replace: true })} />
          )}
        </AnimatePresence>
      </div>

      {step !== 'done' && (
        <div className="border-t border-border px-4 pb-[calc(var(--safe-bottom)+14px)] pt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-2">예약금</span>
            <span className="tnum text-lg font-extrabold">{won(deposit)}원</span>
          </div>
          {step === 'count' ? (
            <Button full variant="brand" size="lg" onClick={() => setStep('pay')}>
              다음 · 예약금 결제하기
            </Button>
          ) : (
            <Button full variant="brand" size="lg" loading={step === 'paying'} onClick={handlePay}>
              {step === 'paying' ? '결제 처리 중' : `${won(deposit)}원 결제하기`}
            </Button>
          )}
        </div>
      )}
    </Screen>
  )
}

function StepCount({
  headcount,
  setHeadcount,
  seatsLeft,
  ticketPrice,
}: {
  headcount: number
  // 함수형 업데이트를 받아야 연속 클릭 시 오래된 클로저 값으로 인해
  // 증감이 누락되는 문제(React 배칭)가 생기지 않습니다.
  setHeadcount: Dispatch<SetStateAction<number>>
  seatsLeft: number
  ticketPrice: number
}) {
  const max = Math.min(4, seatsLeft)
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
      <h2 className="mb-1 text-[15px] font-bold">인원을 선택하세요</h2>
      <p className="mb-4 text-xs text-ink-3">1인당 티켓 {priceLabel(ticketPrice)} · 최대 4인</p>

      <div className="flex items-center justify-center gap-6 rounded-2xl border border-border bg-surface-2 py-8">
        <button
          onClick={() => setHeadcount((h) => Math.max(1, h - 1))}
          disabled={headcount <= 1}
          aria-label="인원 줄이기"
          className="tap flex items-center justify-center rounded-full border border-border-strong bg-surface disabled:opacity-35"
        >
          <Minus size={18} />
        </button>
        <span className="tnum w-16 text-center text-4xl font-extrabold">{headcount}</span>
        <button
          onClick={() => setHeadcount((h) => Math.min(max, h + 1))}
          disabled={headcount >= max}
          aria-label="인원 늘리기"
          className="tap flex items-center justify-center rounded-full border border-border-strong bg-surface disabled:opacity-35"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warn" />
        <p>
          <b className="text-ink">예약금은 입장 시 전액 차감됩니다.</b> 노쇼 방지를 위한
          최소 금액이며, 실제 티켓 요금은 현장에서 결제합니다.
        </p>
      </div>
    </motion.div>
  )
}

function StepPay({
  headcount,
  deposit,
  paying,
}: {
  headcount: number
  deposit: number
  paying: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
      <h2 className="mb-4 text-[15px] font-bold">예약금 결제</h2>

      <div
        className="relative mb-4 flex h-44 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white"
        style={{ backgroundImage: 'linear-gradient(135deg,#2A2A38 0%,#17171C 100%)' }}
      >
        <div className="flex items-center justify-between">
          <CreditCard size={22} />
          <span className="text-xs font-bold tracking-wide opacity-80">MOCK CARD</span>
        </div>
        <div>
          <p className="tnum text-lg font-bold tracking-[0.18em]">•••• •••• •••• 4242</p>
          <div className="tnum mt-2 flex items-center justify-between text-xs opacity-80">
            <span>{SERVICE_NAME} 데모카드</span>
            <span>09/29</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-3.5">
        <Row label="인원" value={`${headcount}명`} />
        <Row label="1인당 예약금" value={priceLabel(DEPOSIT_AMOUNT)} />
        <div className="divider my-1" />
        <Row label="결제 금액" value={`${won(deposit)}원`} bold />
      </div>

      <AnimatePresence>
        {paying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-ink-2"
          >
            <motion.span
              className="h-4 w-4 rounded-full border-2 border-border-strong border-t-[#FF5560]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
            결제를 처리하고 있어요…
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StepDone({ reservationId, onGoTicket }: { reservationId: string; onGoTicket: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center pt-8 text-center"
    >
      <div className="brand-gradient flex h-16 w-16 items-center justify-center rounded-full text-white">
        <CheckCircle2 size={32} />
      </div>
      <h2 className="mt-4 text-lg font-extrabold">예약이 완료되었어요</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
        예약 번호 <span className="tnum font-bold text-ink">{reservationId.toUpperCase()}</span>
        <br />
        QR 티켓으로 현장에서 바로 입장하실 수 있어요.
      </p>
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-left text-xs leading-relaxed text-ink-2">
        <Info size={14} className="mt-0.5 shrink-0 text-ink-3" />
        입장할 때 QR 티켓을 스태프에게 보여주세요. 예약금은 입장 시 전액 차감됩니다.
      </div>
      <Button full variant="brand" size="lg" className="mt-6" onClick={onGoTicket}>
        QR 티켓 보기
      </Button>
    </motion.div>
  )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-2">{label}</span>
      <span className={`tnum text-sm ${bold ? 'font-extrabold' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
