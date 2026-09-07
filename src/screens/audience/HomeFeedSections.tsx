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
        <Icon size={16} className="text-gold-text" />
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

/**
 * 우리 무대 배너 — 실제 건수 기반입니다. 가짜 할인율을 지어내지 않습니다.
 *
 * 예전에는 "무료 공연 N건"이었는데, 결제를 없애면서 모든 공연의 ticketPrice 가 0이
 * 되어 유료 공연까지 무료로 집계됐습니다. 지금은 "우리가 참석 예정을 받는 공연"
 * 건수입니다 — 등록 공연은 원본 예매처로 보내니까요.
 */
export function OwnShowsBanner({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null
  return (
    <button
      onClick={onClick}
      className="bg-gold-500 mb-5 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-gold-ink"
    >
      <div>
        <p className="text-xs font-bold opacity-90">바로 참석 예정할 수 있는</p>
        <p className="mt-0.5 text-[15px] font-extrabold">우리 무대 {count}건 보러가기</p>
      </div>
      <Sparkles size={22} className="shrink-0" />
    </button>
  )
}
