import { motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, Info, Minus, Plus } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '@/components/shell/ScreenHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShowPoster } from '@/components/ui/ShowPoster'
import { FREE_TRIAL_NOTICE } from '@/config/brand'
import { humanDateTime, priceLabel } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore, useNow } from '@/store/useAppStore'

/**
 * 참석 예정 등록.
 *
 * 결제가 없는 서비스라 단계는 인원 선택 → 완료, 둘뿐입니다.
 * 예약금·결제·QR 티켓은 전부 없앴고, 입장 확인은 호스트 화면의 참석 명단에서 합니다.
 */
export function BookingFlow() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const createReservation = useAppStore((s) => s.createReservation)
  const nowIso = useNow()

  const [done, setDone] = useState(false)
  const [headcount, setHeadcount] = useState(1)

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
        <EmptyState art="ticket" title="공연을 찾을 수 없어요" />
      </Screen>
    )
  }

  const seatsLeft = Math.max(0, show.capacity - show.reservedCount)

  const handleConfirm = () => {
    createReservation(show.id, headcount)
    setDone(true)
  }

  return (
    <Screen>
      <div className="flex items-center gap-2 border-b border-border px-4 pb-3 pt-12">
        <IconButton label="뒤로" onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </IconButton>
        <h1 className="text-[16px] font-bold">{done ? '참석 예정 완료' : '참석 예정'}</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3">
          <ShowPoster
            posterUrl={show.posterUrl}
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

        {done ? (
          <StepDone onGoMy={() => navigate('/audience/my', { replace: true })} />
        ) : (
          <StepCount
            headcount={headcount}
            setHeadcount={setHeadcount}
            seatsLeft={seatsLeft}
            ticketPrice={show.ticketPrice}
          />
        )}
      </div>

      {!done && (
        <div className="border-t border-border px-4 pb-[calc(var(--safe-bottom)+14px)] pt-3">
          <p className="mb-2.5 text-center text-2xs text-ink-3">{FREE_TRIAL_NOTICE}</p>
          <Button full variant="brand" size="lg" onClick={handleConfirm} disabled={seatsLeft === 0}>
            {seatsLeft === 0 ? '정원이 마감되었어요' : `${headcount}명 참석 예정하기`}
          </Button>
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
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
      <h2 className="mb-1 text-[15px] font-bold">몇 분이 오시나요?</h2>
      <p className="mb-4 text-xs text-ink-3">
        1인당 티켓 {priceLabel(ticketPrice)} · 최대 4인 · 남은 자리 {seatsLeft}석
      </p>

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
        <Info size={15} className="mt-0.5 shrink-0 text-gold-text" />
        <p>
          <b className="text-ink">미리 낼 돈은 없습니다.</b> 티켓 요금이 있는 공연은 현장에서
          직접 내시면 됩니다. 못 가게 되면 시작 3시간 전까지 취소해 주세요.
        </p>
      </div>
    </motion.div>
  )
}

function StepDone({ onGoMy }: { onGoMy: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <CheckCircle2 size={56} className="mx-auto text-gold-text" />
      <h2 className="mt-4 text-[17px] font-extrabold">참석 예정으로 등록됐어요</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
        호스트에게 참석 인원이 전달됐습니다.
        <br />
        공연 당일 현장에서 닉네임을 말씀해 주세요.
      </p>
      <Button variant="brand" size="lg" full className="mt-6" onClick={onGoMy}>
        내 참석 예정 보기
      </Button>
    </motion.div>
  )
}
