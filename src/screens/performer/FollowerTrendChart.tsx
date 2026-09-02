import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Users } from 'lucide-react'
import { makeRng, rngInt } from '@/lib/rng'

/** 8주 팔로워 추이를 시드 고정 난수로 만들어 보여주는 미니 스파크라인 */
export function FollowerTrendChart({ performerId, current }: { performerId: string; current: number }) {
  const data = useMemo(() => {
    const rng = makeRng(`follower-${performerId}`)
    const weeks = 8
    const points: Array<{ week: string; followers: number }> = []
    let value = current
    const raw: number[] = [value]
    for (let i = 0; i < weeks - 1; i++) {
      value = Math.max(0, value - rngInt(rng, 4, Math.round(current * 0.05) + 6))
      raw.push(value)
    }
    raw.reverse()
    raw.forEach((v, i) => points.push({ week: i === weeks - 1 ? '이번 주' : `${weeks - 1 - i}주 전`, followers: v }))
    return points
  }, [performerId, current])

  const growth = data[data.length - 1].followers - data[0].followers
  const pct = data[0].followers > 0 ? Math.round((growth / data[0].followers) * 100) : 0

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-ink-2" />
          <h3 className="text-[13px] font-bold">팔로워 추이</h3>
        </div>
        <span className={pct >= 0 ? 'tnum text-xs font-bold text-ok' : 'tnum text-xs font-bold text-danger'}>
          {pct >= 0 ? '+' : ''}
          {pct}% · 8주
        </span>
      </div>
      <div style={{ width: '100%', height: 84 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
            <XAxis dataKey="week" hide />
            <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
            <Tooltip
              formatter={(v: number) => [`${v.toLocaleString('ko-KR')}명`, '팔로워']}
              labelFormatter={(l) => l}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E5EA' }}
            />
            <Line type="monotone" dataKey="followers" stroke="#FFC42E" strokeWidth={2.4} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
