import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { compareWeeks, saveWeeklyStat, type WeeklyStat } from '@/hooks/useVenueStats'
import { shiftWeek, weekLabel, weekStartKey } from '@/lib/datetime'
import { toast } from '@/store/useToast'

/** 비어 있으면 물어볼 지난 주 수. 더 거슬러 올라가면 기억이 안 납니다 */
const ASK_WEEKS = 3

/**
 * 주간 손님 수 — 공연이 장사에 도움이 되는지 답하는 화면 (§14).
 *
 * ★ 사장님을 설득하는 문장은 하나입니다: "공연한 주에 손님이 N명 더 왔습니다."
 *   그 문장을 만들려면 공연이 **없던** 주의 손님 수가 있어야 하는데, 우리는
 *   알 방법이 없습니다. 그래서 주 1회, 한 줄만 여쭙습니다.
 *
 * ★ 끝난 주만 여쭙습니다. 진행 중인 주는 아직 절반이라, 그 값을 지난 주들과
 *   나란히 두면 "공연 주에 손님이 줄었다"는 없는 사실이 만들어집니다.
 *
 * ★ 조건이 안 되면 그래프를 그리지 않고 무엇이 모자란지 그대로 말합니다.
 *   없는 비교를 지어내지 않는 것이 이 서비스의 숫자 원칙입니다.
 */
export function WeeklyVisitors({
  venueId,
  venueName,
  rows,
  nowIso,
  onSaved,
}: {
  venueId: string
  /** 공간이 여러 곳일 때만 표시 */
  venueName?: string
  rows: WeeklyStat[]
  nowIso: string
  onSaved: () => void
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const mine = useMemo(() => rows.filter((r) => r.venueId === venueId), [rows, venueId])

  /** 아직 안 적은, 이미 끝난 주 (최근 것부터) */
  const missing = useMemo(() => {
    const have = new Set(mine.map((r) => r.weekStart))
    const lastDone = shiftWeek(weekStartKey(nowIso), -1)
    return Array.from({ length: ASK_WEEKS }, (_, i) => shiftWeek(lastDone, -i)).filter(
      (w) => !have.has(w),
    )
  }, [mine, nowIso])

  const cmp = useMemo(() => compareWeeks(mine), [mine])

  const save = async (week: string) => {
    const raw = (drafts[week] ?? '').trim()
    if (raw === '') {
      toast('손님 수를 적어주세요', 'warn', '대략이어도 괜찮습니다')
      return
    }
    setBusy(week)
    const err = await saveWeeklyStat(venueId, week, Number(raw), '')
    setBusy(null)
    if (err) {
      toast('저장하지 못했어요', 'error', err)
      return
    }
    setDrafts((d) => ({ ...d, [week]: '' }))
    toast('기록했어요', 'success', weekLabel(week))
    onSaved()
  }

  return (
    <div className="card p-4">
      {venueName && <p className="mb-2 text-2xs font-bold text-ink-3">{venueName}</p>}

      {missing.length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-2xs leading-relaxed text-ink-2">
            <b>{weekLabel(missing[0])}</b>에 가게에 몇 분이 오셨나요? 공연이 없던 주도 꼭
            적어주세요 — <b>비교할 대상</b>이 있어야 공연 효과가 보입니다.
          </p>
          {missing.map((w) => (
            <div key={w} className="flex items-center gap-2">
              <span className="tnum w-[92px] shrink-0 text-2xs font-semibold text-ink-2">
                {weekLabel(w)}
              </span>
              <TextInput
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="예) 120"
                value={drafts[w] ?? ''}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [w]: e.target.value.replace(/[^0-9]/g, '') }))
                }
              />
              <Button
                size="sm"
                variant="brand"
                loading={busy === w}
                onClick={() => void save(w)}
                leading={<Check size={13} />}
              >
                저장
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-2xs font-semibold text-ink-2">
          <Check size={13} className="text-gold-text" />
          지난주까지 다 적으셨어요
        </p>
      )}

      <div className="mt-4 border-t border-border pt-3.5">
        {cmp.ready ? (
          <WeeklyBars cmp={cmp} />
        ) : (
          <>
            <p className="text-2xs font-bold text-ink-2">{cmp.needLabel}</p>
            <p className="mt-1 text-2xs leading-relaxed text-ink-3">
              공연이 있던 주 {cmp.showWeeks}주 · 없던 주 {cmp.quietWeeks}주 모였습니다. 양쪽이
              모여야 <b>“공연한 주에 몇 명 더 왔는지”</b>를 계산할 수 있어요.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/** 공연 있던 주 vs 없던 주 평균 */
function WeeklyBars({ cmp }: { cmp: ReturnType<typeof compareWeeks> }) {
  const max = Math.max(cmp.showAvg, cmp.quietAvg, 1)
  const diff = Math.round(cmp.diff)
  const rows = [
    { label: '공연한 주', value: cmp.showAvg, weeks: cmp.showWeeks, brand: true },
    { label: '공연 없던 주', value: cmp.quietAvg, weeks: cmp.quietWeeks, brand: false },
  ]

  return (
    <>
      <p className="text-sm font-extrabold leading-snug">
        {diff > 0 ? (
          <>
            공연한 주에 손님이 <span className="text-gold-text">{diff}명</span> 더 왔습니다
          </>
        ) : diff < 0 ? (
          <>공연한 주가 평균 {Math.abs(diff)}명 적었습니다</>
        ) : (
          <>공연한 주와 없던 주가 비슷했습니다</>
        )}
      </p>

      <div className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-2xs text-ink-2">
                {r.label}
                <span className="tnum ml-1 text-ink-3">{r.weeks}주</span>
              </span>
              <span className="tnum text-2xs font-bold">
                주 평균 {Math.round(r.value)}명
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={r.brand ? 'bg-gold-500 h-full rounded-full' : 'h-full rounded-full bg-border-strong'}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-2xs leading-relaxed text-ink-3">
        사장님이 적어주신 숫자만으로 계산했습니다. 날씨·연휴처럼 공연과 무관한 이유도
        섞여 있으니, 주가 쌓일수록 정확해집니다.
      </p>
    </>
  )
}
