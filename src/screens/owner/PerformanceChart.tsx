import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { WeeklyVisitStat } from '@/types'

const BRAND = '#5B84DE'
const MUTED = '#D1D1D9'

interface TooltipPayload {
  payload: WeeklyVisitStat
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold">{d.weekLabel}</p>
      <p className="tnum mt-0.5 text-ink-2">
        방문객 {d.visitors.toLocaleString('ko-KR')}명
      </p>
      <p className={d.hadShow ? 'mt-0.5 font-semibold text-[#5B84DE]' : 'mt-0.5 text-ink-3'}>
        {d.hadShow ? '공연 있던 주' : '공연 없던 주'}
      </p>
    </div>
  )
}

/**
 * ★ 성과 리포트 — 이 화면이 시연의 하이라이트입니다.
 * 최근 8주 주간 방문객을 공연 유무로 구분해 보여주고,
 * "공연이 있으면 손님이 이만큼 더 옵니다"를 숫자로 증명합니다.
 */
export function PerformanceChart({ stats }: { stats: WeeklyVisitStat[] }) {
  const { avgWith, avgWithout, pct } = useMemo(() => {
    const withShow = stats.filter((s) => s.hadShow).map((s) => s.visitors)
    const withoutShow = stats.filter((s) => !s.hadShow).map((s) => s.visitors)
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    const a = avg(withShow)
    const b = avg(withoutShow)
    return {
      avgWith: Math.round(a),
      avgWithout: Math.round(b),
      pct: b > 0 ? Math.round(((a - b) / b) * 100) : 0,
    }
  }, [stats])

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center gap-1.5">
        <TrendingUp size={15} className="text-[#5B84DE]" />
        <h3 className="text-[15px] font-bold">주간 방문객 성과 리포트</h3>
      </div>
      <p className="mb-3 text-2xs text-ink-3">최근 8주 · 공연이 있던 주 vs 없던 주</p>

      <div style={{ width: '100%', height: 168 }}>
        <ResponsiveContainer>
          <BarChart data={stats} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E5E5EA" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 9, fill: '#8B8B96' }}
              axisLine={{ stroke: '#E5E5EA' }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#8B8B96' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(23,23,28,0.04)' }} />
            <Bar dataKey="visitors" radius={[6, 6, 0, 0]} maxBarSize={28}>
              {stats.map((s, i) => (
                <Cell key={i} fill={s.hadShow ? BRAND : MUTED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-3 text-2xs text-ink-3">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: BRAND }} />
          공연 있던 주 (평균 {avgWith.toLocaleString('ko-KR')}명)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: MUTED }} />
          없던 주 (평균 {avgWithout.toLocaleString('ko-KR')}명)
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-surface-2 p-3">
        <p className="text-[13px] font-semibold leading-relaxed">
          공연이 있던 주 평균 방문객이 없던 주보다{' '}
          <span className="text-[#5B84DE]">{pct > 0 ? `${pct}%` : `${Math.abs(pct)}%`}</span>{' '}
          {pct >= 0 ? '높습니다' : '낮습니다'}.
        </p>
      </div>
    </div>
  )
}
