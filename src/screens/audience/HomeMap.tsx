import { AnimatePresence, motion } from 'framer-motion'
import { LayoutList, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShowCard, ShowMiniCard } from '@/components/cards/ShowCard'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { MapView } from '@/components/map/MapView'
import { EmptyState } from '@/components/ui/EmptyState'
import { Chip } from '@/components/ui/Chip'
import { SnapSheet, type SnapIndex } from '@/components/ui/SnapSheet'
import { SERVICE_NAME } from '@/config/brand'
import { cn } from '@/lib/cn'
import { computeTrendingKeywords } from '@/lib/trending'
import { DEFAULT_FILTER, filterShows, withMeta } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import type { SortKey } from '@/types'
import { FilterChips } from './FilterChips'
import { FilterSheet } from './FilterSheet'
import { TrendingSearchPanel } from './TrendingSearchPanel'

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'soon', label: '임박순' },
  { value: 'near', label: '거리순' },
  { value: 'rating', label: '별점순' },
  { value: 'likes', label: '인기순' },
  { value: 'recommend', label: '추천순' },
]

export function HomeMap() {
  const navigate = useNavigate()
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const toggleLike = useAppStore((s) => s.toggleLike)
  const nowIso = useAppStore((s) => s.demoNowIso)
  const filter = useAppStore((s) => s.audienceFilter)
  const setFilter = useAppStore((s) => s.setAudienceFilter)
  const highlightShowId = useAppStore((s) => s.demo.highlightShowId)

  const [view, setView] = useState<'map' | 'list'>('map')
  const [snap, setSnap] = useState<SnapIndex>(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const all = useMemo(() => withMeta(shows, venues, performers), [shows, venues, performers])
  const results = useMemo(() => filterShows(all, filter, nowIso), [all, filter, nowIso])
  const trending = useMemo(() => computeTrendingKeywords(all), [all])

  const ownCount = results.filter((r) => r.show.source === 'own').length
  const kopisCount = results.length - ownCount
  const selected = results.find((r) => r.show.id === selectedId) ?? null

  const openShow = (id: string) => navigate(`/audience/show/${id}`)

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      {view === 'map' ? (
        <div className="absolute inset-0">
          <MapView
            items={results}
            selectedId={selectedId}
            onSelect={setSelectedId}
            highlightShowId={highlightShowId}
          />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-y-auto px-4 pt-[132px]">
          <ResultList
            results={results}
            nowIso={nowIso}
            likedShowIds={likedShowIds}
            onToggleLike={toggleLike}
            onOpen={openShow}
            highlightShowId={highlightShowId}
            onReset={() => setFilter(DEFAULT_FILTER)}
          />
          <TabBarSpacer />
        </div>
      )}

      {/* 상단 검색 + 필터 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 pb-3 pt-11">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.9) 62%, rgba(255,255,255,0) 100%)',
          }}
        />
        <div className="pointer-events-auto relative">
          <div className="mb-2.5 flex items-center gap-2 px-4">
            {searchOpen ? (
              <div className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3.5">
                <Search size={15} className="shrink-0 text-ink-3" />
                <input
                  autoFocus
                  value={filter.query}
                  onChange={(e) => setFilter({ query: e.target.value })}
                  placeholder="팀 이름, 공간, 장르 검색"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
                />
                <button
                  aria-label="검색 닫기"
                  onClick={() => {
                    setFilter({ query: '' })
                    setSearchOpen(false)
                  }}
                  className="shrink-0 text-ink-3"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-left"
                >
                  <Search size={15} className="text-ink-3" />
                  <span className="truncate text-sm text-ink-3">
                    {filter.query || `${SERVICE_NAME} · 오늘 뭐 볼까요?`}
                  </span>
                </button>
                <button
                  onClick={() => setFilterOpen(true)}
                  aria-label="필터 열기"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                    filter.genres.length > 0 || filter.price !== 'all' || filter.ownOnly
                      ? 'border-transparent bg-ink text-bg'
                      : 'border-border bg-surface text-ink-2',
                  )}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </>
            )}
          </div>
          {searchOpen && !filter.query.trim() && (
            <div className="pointer-events-auto mb-2.5">
              <TrendingSearchPanel
                keywords={trending}
                onSelect={(term) => setFilter({ query: term })}
              />
            </div>
          )}
          <FilterChips
            filter={filter}
            onChange={setFilter}
            onOpenSheet={() => setFilterOpen(true)}
          />
        </div>
      </div>

      {/* 지도/리스트 전환 */}
      <button
        onClick={() => setView(view === 'map' ? 'list' : 'map')}
        className="absolute right-4 top-[136px] z-40 flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3.5 text-xs font-bold text-ink backdrop-blur"
      >
        {view === 'map' ? <LayoutList size={15} /> : <MapIcon size={15} />}
        {view === 'map' ? '리스트' : '지도'}
      </button>

      {/* 마커 미니 카드 */}
      <AnimatePresence>
        {view === 'map' && selected && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute left-1/2 z-40 -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-surface/97 backdrop-blur-xl"
            style={{ bottom: snap === 0 ? 150 : 402, boxShadow: '0 16px 40px rgba(0,0,0,.55)' }}
          >
            <ShowMiniCard
              item={selected}
              nowIso={nowIso}
              onClick={() => openShow(selected.show.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 결과 바텀시트 */}
      {view === 'map' && (
        <SnapSheet
          snap={snap}
          onSnapChange={setSnap}
          heights={[136, 400, 704]}
          header={
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[15px] font-bold">
                  이 지역 공연 <span className="tnum">{results.length}</span>건
                </h2>
                <span className="tnum text-2xs text-ink-3">
                  우리 무대 {ownCount} · 등록 공연 {kopisCount}
                </span>
              </div>
              <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
                {SORT_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    active={filter.sort === o.value}
                    onClick={() => setFilter({ sort: o.value })}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          }
        >
          <div className="mt-2">
            <ResultList
              results={results}
              nowIso={nowIso}
              likedShowIds={likedShowIds}
              onToggleLike={toggleLike}
              onOpen={openShow}
              highlightShowId={highlightShowId}
              onReset={() => setFilter(DEFAULT_FILTER)}
            />
          </div>
        </SnapSheet>
      )}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filter={filter}
        onChange={setFilter}
        resultCount={results.length}
      />
    </div>
  )
}

function ResultList({
  results,
  nowIso,
  likedShowIds,
  onToggleLike,
  onOpen,
  highlightShowId,
  onReset,
}: {
  results: ReturnType<typeof filterShows>
  nowIso: string
  likedShowIds: string[]
  onToggleLike: (id: string) => void
  onOpen: (id: string) => void
  highlightShowId: string | null
  onReset: () => void
}) {
  if (results.length === 0) {
    return (
      <EmptyState
        art="search"
        title="조건에 맞는 공연이 없어요"
        description="거리를 넓히거나 기간을 ‘전체’로 바꿔보세요."
        action={
          <button
            onClick={onReset}
            className="rounded-xl border border-border-strong px-4 py-2.5 text-xs font-bold"
          >
            필터 초기화
          </button>
        }
      />
    )
  }
  return (
    <div className="space-y-2.5">
      {results.map((item) => (
        <ShowCard
          key={item.show.id}
          item={item}
          nowIso={nowIso}
          liked={likedShowIds.includes(item.show.id)}
          onToggleLike={() => onToggleLike(item.show.id)}
          onClick={() => onOpen(item.show.id)}
          highlighted={item.show.id === highlightShowId}
        />
      ))}
    </div>
  )
}
