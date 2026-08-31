import { Flame, History, Sparkles, type LucideIcon } from 'lucide-react'
import { ShowMiniCard } from '@/components/cards/ShowCard'
import type { ShowWithMeta } from '@/store/selectors'

function Row({
  title,
  icon: Icon,
  items,
  nowIso,
  onOpen,
}: {
  title: string
  icon: LucideIcon
  items: ShowWithMeta[]
  nowIso: string
  onOpen: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <section className="mb-5">
      <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold">
        <Icon size={16} className="text-[#FF3D77]" />
        {title}
      </h2>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
        {items.map((item) => (
          <div key={item.show.id} className="card w-[248px] shrink-0 overflow-hidden">
            <ShowMiniCard item={item} nowIso={nowIso} onClick={() => onOpen(item.show.id)} />
          </div>
        ))}
      </div>
    </section>
  )
}

/** 최근에 상세를 열어본 공연들 — 최신순 */
export function RecentlyViewedRow(props: {
  items: ShowWithMeta[]
  nowIso: string
  onOpen: (id: string) => void
}) {
  return <Row title="최근 본 공연" icon={History} {...props} />
}

/** 좋아요 수 기준 인기 공연 */
export function TrendingRow(props: {
  items: ShowWithMeta[]
  nowIso: string
  onOpen: (id: string) => void
}) {
  return <Row title="요즘 뜨는 공연" icon={Flame} {...props} />
}

/** 실제 데이터(무료 공연 건수) 기반 배너 — 가짜 할인율을 지어내지 않습니다 */
export function FreeShowsBanner({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null
  return (
    <button
      onClick={onClick}
      className="brand-gradient mb-5 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-white"
    >
      <div>
        <p className="text-xs font-bold opacity-90">지금 예약할 수 있는</p>
        <p className="mt-0.5 text-[15px] font-extrabold">무료 공연 {count}건 보러가기</p>
      </div>
      <Sparkles size={22} className="shrink-0" />
    </button>
  )
}
