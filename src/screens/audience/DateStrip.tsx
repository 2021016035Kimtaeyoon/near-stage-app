import { useMemo } from 'react'
import { dateKey, dayRange, showEndMs, WEEKDAY_LABELS } from '@/lib/datetime'
import { runsInRange } from '@/lib/showSchedule'
import { cn } from '@/lib/cn'
import type { ShowWithMeta } from '@/store/selectors'

const DAYS = 21

/**
 * 날짜별 공연 보기.
 *
 * ★ "오늘 밤 / 주말 / 전체" 세 개로는 원하는 날짜를 고를 수 없었습니다. 등록 공연은
 *   기간 공연이 많아서 "다음 주 토요일에 뭐 하지"가 이 서비스에서 가장 자연스러운
 *   질문인데, 그걸 물을 방법이 없었습니다.
 *
 * ★ 날짜마다 공연 수를 함께 보여줍니다. 숫자가 없으면 눌러봐야 비었는지 알 수 있고,
 *   그러면 몇 번 헛손질한 뒤 아무도 안 씁니다. 0건인 날은 눌리지 않게 합니다.
 *
 * ★ 개수는 거리·장르 조건을 뺀 값입니다. 날짜 스트립은 "그 날 공연이 있는지"를
 *   말해야 하는데, 지금 걸린 조건까지 반영하면 조건을 좁힐 때마다 숫자가 흔들려서
 *   달력으로 못 씁니다.
 */
export function DateStrip({
  items,
  value,
  onChange,
  nowIso,
}: {
  /** 조건 적용 전 전체 공연 */
  items: ShowWithMeta[]
  /** 선택된 날짜 (YYYY-MM-DD). null 이면 날짜 선택 안 함 */
  value: string | null
  onChange: (date: string | null) => void
  nowIso: string
}) {
  const days = useMemo(() => {
    const now = new Date(nowIso)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const nowMs = now.getTime()

    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const key = dateKey(d)
      const { from, to } = dayRange(key)
      // 기간이 그날과 겹치고, 아직 끝나지 않은 공연
      // ★ 목록과 똑같은 기준으로 세야 합니다. 여기서는 겹침만 보고 목록은 요일까지
      //   보면, 3건이라고 적힌 날을 눌렀을 때 0건이 나옵니다.
      const count = items.filter((x) => {
        const start = new Date(x.show.startAt).getTime()
        const end = showEndMs(x.show)
        if (end < Math.max(from, nowMs) || start > to) return false
        return runsInRange(x.show.scheduleNote, from, to) !== false
      }).length
      return { key, date: d, count, isToday: i === 0 }
    })
  }, [items, nowIso])

  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'flex h-[58px] shrink-0 flex-col items-center justify-center rounded-xl border px-3 transition-colors',
          value === null
            ? 'bg-gold-500 border-transparent text-gold-ink'
            : 'border-border bg-surface text-ink-2',
        )}
      >
        <span className="text-2xs font-bold">전체</span>
        <span className="tnum mt-0.5 text-2xs opacity-70">{items.length}</span>
      </button>

      {days.map((d) => {
        const empty = d.count === 0
        const active = value === d.key
        return (
          <button
            key={d.key}
            disabled={empty}
            onClick={() => onChange(active ? null : d.key)}
            className={cn(
              'flex h-[58px] w-[46px] shrink-0 flex-col items-center justify-center rounded-xl border transition-colors',
              active
                ? 'bg-gold-500 border-transparent text-gold-ink'
                : empty
                  ? 'border-border/60 bg-surface text-ink-3 opacity-45'
                  : 'border-border bg-surface text-ink-2',
            )}
          >
            <span
              className={cn(
                'text-[10px] font-semibold',
                !active && d.date.getDay() === 0 && 'text-danger',
                !active && d.date.getDay() === 6 && 'text-gold-text',
              )}
            >
              {d.isToday ? '오늘' : WEEKDAY_LABELS[d.date.getDay()]}
            </span>
            <span className="tnum text-[15px] font-extrabold leading-tight">
              {d.date.getDate()}
            </span>
            <span className="tnum text-[9px] opacity-70">{empty ? '—' : d.count}</span>
          </button>
        )
      })}
    </div>
  )
}
