import { PhoneFrame } from '@/components/shell/PhoneFrame'
import { SERVICE_DESCRIPTION, SERVICE_NAME } from '@/config/brand'
import { createSeedData } from '@/data/seed'

/** 단계 1 임시 화면 — 시드 데이터가 제대로 조립되는지 확인용 (단계 2에서 라우터로 교체) */
export default function App() {
  const data = createSeedData()
  const own = data.shows.filter((s) => s.source === 'own').length
  const kopis = data.shows.filter((s) => s.source === 'kopis').length

  const rows: Array<[string, number]> = [
    ['공간', data.venues.length],
    ['공연자', data.performers.length],
    ['공연 (우리 무대)', own],
    ['공연 (등록 공연)', kopis],
    ['구인글', data.posts.length],
    ['지원', data.posts.reduce((n, p) => n + p.applications.length, 0)],
    ['역경매', data.reverseBids.length],
    ['리뷰', data.reviews.length],
    ['알림', data.notifications.length],
    ['정산', data.settlements.length],
    ['주간 방문객 레코드', data.weeklyStats.length],
  ]

  return (
    <PhoneFrame>
      <div className="h-full overflow-y-auto p-6">
        <h1 className="brand-text text-2xl font-extrabold">{SERVICE_NAME}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{SERVICE_DESCRIPTION}</p>
        <div className="card mt-6 divide-y divide-border">
          {rows.map(([label, n]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink-2">{label}</span>
              <span className="tnum text-lg font-bold">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}
