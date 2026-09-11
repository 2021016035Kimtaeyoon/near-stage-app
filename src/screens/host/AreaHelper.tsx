import { Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Label, TextInput } from '@/components/ui/Field'

/** 1평 = 3.3058㎡ */
const PYEONG_TO_M2 = 3.3058

/**
 * 관람 밀도 (㎡/인).
 *
 * 공연 관람은 착석·입석에 따라 필요 면적이 크게 다릅니다. 여기 숫자는 가정이고,
 * 화면에 그 가정을 적어둡니다 — 근거 없는 숫자를 보여주지 않기 위함입니다.
 * 무대·통로·주방처럼 손님이 앉지 못하는 면적을 제외하고 60% 만 관람석으로 봅니다.
 */
const DENSITY = {
  seated: { label: '앉아서 관람', m2: 1.2 },
  standing: { label: '서서 관람', m2: 0.6 },
} as const

const USABLE_RATIO = 0.6

/**
 * 평수로 수용 인원 추정.
 *
 * 사진으로는 면적을 알 수 없습니다(깊이 정보가 없어서). 대신 사장님이 아는 평수를
 * 받아 수용 인원을 계산해드립니다. 계산식과 가정을 화면에 그대로 적어서, 사장님이
 * 값을 믿을지 스스로 판단할 수 있게 합니다.
 */
export function AreaHelper({ onApply }: { onApply: (capacity: number) => void }) {
  const [pyeong, setPyeong] = useState('')
  const [mode, setMode] = useState<keyof typeof DENSITY>('seated')

  const p = Number(pyeong)
  const valid = pyeong.trim() !== '' && Number.isFinite(p) && p > 0 && p <= 300
  const m2 = valid ? p * PYEONG_TO_M2 : 0
  const usable = m2 * USABLE_RATIO
  const people = valid ? Math.max(1, Math.floor(usable / DENSITY[mode].m2)) : 0

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
      <Label hint="평수를 아시면 수용 인원을 계산해드립니다">평수로 계산하기</Label>

      <div className="flex gap-2">
        <div className="w-24">
          <TextInput
            type="number"
            inputMode="decimal"
            step="0.5"
            value={pyeong}
            onChange={(e) => setPyeong(e.target.value)}
            placeholder="평"
          />
        </div>
        <div className="flex flex-1 gap-1.5">
          {(Object.keys(DENSITY) as Array<keyof typeof DENSITY>).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={`h-11 flex-1 rounded-xl border text-xs font-bold ${
                mode === k
                  ? 'border-transparent bg-ink text-bg'
                  : 'border-border bg-surface text-ink-2'
              }`}
            >
              {DENSITY[k].label}
            </button>
          ))}
        </div>
      </div>

      {valid && (
        <>
          <Button variant="brand" full className="mt-2.5" onClick={() => onApply(people)}>
            약 {people}명으로 입력
          </Button>
          <p className="tnum mt-2 flex items-start gap-1.5 text-2xs leading-relaxed text-ink-3">
            <Info size={11} className="mt-0.5 shrink-0" />
            {p}평 = {m2.toFixed(1)}㎡ 중 관람석으로 쓸 수 있는 {Math.round(USABLE_RATIO * 100)}%(
            {usable.toFixed(1)}㎡)를 1인당 {DENSITY[mode].m2}㎡로 나눈 값입니다. 무대·통로·주방을
            뺀 가정이라 실제와 다를 수 있으니 확인하고 고쳐주세요.
          </p>
        </>
      )}
    </div>
  )
}
