import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import type { Show } from '@/types'

/** 이번 주 요일 스트립 — 공연이 있는 날에 점을 찍고, 탭하면 그 날짜로 리스트를 좁힙니다 */
export function ShowWeekStrip({
  nowIso,
  shows,
  selectedDate,
  onSelectDate,
}: {
  nowIso: string
  shows: Show[]
  selectedDate: string | null
  onSelectDate: (dateKey: string | null) => void
}) {
  const days = useMemo(() => {
    const now = new Date(nowIso)
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const hasShow = shows.some((s) => s.startAt.slice(0, 10) === key)
      const isToday = key === now.toISOString().slice(0, 10)
      return { key, label: '일월화수목금토'[d.getDay()], date: d.getDate(), hasShow, isToday }
    })
  }, [nowIso, shows])

  return (
    <div className="flex gap-1.5">
      {days.map((d) => (
        <button
          key={d.key}
          onClick={() => onSelectDate(selectedDate === d.key ? null : d.key)}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-2xs font-bold transition-colors',
            selectedDate === d.key
              ? 'brand-gradient border-transparent text-white'
              : d.isToday
                ? 'border-border-strong bg-surface-2 text-ink'
                : 'border-border bg-surface text-ink-2',
          )}
        >
          <span>{d.label}</span>
          <span className="tnum text-sm">{d.date}</span>
          <span
            className={cn(
              'h-1 w-1 rounded-full',
              d.hasShow ? (selectedDate === d.key ? 'bg-white' : 'bg-[#FF5560]') : 'bg-transparent',
            )}
          />
        </button>
      ))}
    </div>
  )
}
