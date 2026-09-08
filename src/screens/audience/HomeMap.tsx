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
import { distanceKm } from '@/lib/geo'
import { computeTrendingKeywords } from '@/lib/trending'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyLikes } from '@/hooks/useEngagement'
import { usePublicShows, useViewerLocation } from '@/hooks/usePublicShows'
import { DEFAULT_FILTER, filterShows, relaxSuggestion } from '@/store/selectors'
import { useAppStore, useNow } from '@/store/useAppStore'
import type { AudienceFilter, SortKey } from '@/types'
import { DateStrip } from './DateStrip'
import { FilterChips } from './FilterChips'
import { FilterSheet } from './FilterSheet'
import { OwnShowsBanner, RecentlyViewedRow, TrendingRow } from './HomeFeedSections'
import { TrendingSearchPanel } from './TrendingSearchPanel'

/** 바텀시트 스냅 높이 */
const SHEET_HEIGHTS = [136, 400, 704] as const

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'soon', label: '임박순' },
  { value: 'near', label: '거리순' },
  { value: 'rating', label: '별점순' },
  { value: 'likes', label: '인기순' },
  { value: 'recommend', label: '추천순' },
]

export function HomeMap() {
  const navigate = useNavigate()
  const { data: all, loading, error, refresh } = usePublicShows()
  // 좋아요는 내 계정에 저장됩니다 (§12). 로그인 전에는 빈 목록이고, 하트를
  // 누르면 로그인 시트가 뜹니다.
  const likes = useMyLikes()
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const likedShowIds = likes.data
  const toggleLike = (id: string) => requireAuth(() => void likes.toggle(id))
  const recentlyViewedShowIds = useAppStore((s) => s.recentlyViewedShowIds)
  const nowIso = useNow()
  const filter = useAppStore((s) => s.audienceFilter)
  const setFilter = useAppStore((s) => s.setAudienceFilter)
  const highlightShowId = useAppStore((s) => s.highlightShowId)

  // 홈은 지도 단독이 아니라 상단 검색창 + 하단 공연 리스트가 기본입니다
  const [view, setView] = useState<'map' | 'list'>('list')
  const [snap, setSnap] = useState<SnapIndex>(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // ★ 지도를 옮긴 뒤 "이 지역에서 찾기"를 누르면 그 지점 기준으로 거리를 다시
  //   계산합니다. 옮긴 만큼 자동으로 바뀌면 손을 뗄 때마다 목록이 흔들려서
  //   읽을 수가 없습니다.
  const viewerOrigin = useViewerLocation()
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null)
  const origin = searchCenter ?? viewerOrigin

  // 검색 중심이 바뀌면 거리를 다시 재고 필터를 다시 적용합니다
  const scoped = useMemo(
    () =>
      searchCenter
        ? all.map((x) => ({
            ...x,
            distanceKm: distanceKm(searchCenter, { lat: x.place.lat, lng: x.place.lng }),
          }))
        : all,
    [all, searchCenter],
  )
  const results = useMemo(() => filterShows(scoped, filter, nowIso), [scoped, filter, nowIso])
  // 결과가 0이면 무엇을 풀면 몇 건이 나오는지 미리 계산해 둡니다
  // ★ 지도 초기 중심 — 내 위치가 아니라 "가장 가까운 공연"입니다. 근처에 공연이
  //   없을 때 빈 지도를 보여주지 않기 위함입니다. 내 위치 마커와 거리 계산은
  //   그대로 origin 을 씁니다.
  const mapCenter = useMemo(() => {
    const nearest = [...results].sort((a, b) => a.distanceKm - b.distanceKm)[0]
    return nearest ? { lat: nearest.place.lat, lng: nearest.place.lng } : origin
  }, [results, origin])

  const relax = useMemo(
    () => (results.length === 0 ? relaxSuggestion(scoped, filter, nowIso) : null),
    [results.length, scoped, filter, nowIso],
  )
  const trending = useMemo(() => computeTrendingKeywords(all), [all])

  const upcoming = useMemo(() => all.filter((a) => a.show.startAt >= nowIso), [all, nowIso])
  const recentlyViewed = useMemo(
    () =>
      recentlyViewedShowIds
        .map((id) => all.find((a) => a.show.id === id))
        .filter((a): a is (typeof all)[number] => Boolean(a))
        .slice(0, 8),
    [recentlyViewedShowIds, all],
  )
  const trendingShows = useMemo(
    () => [...upcoming].sort((a, b) => b.show.likes - a.show.likes).slice(0, 8),
    [upcoming],
  )
  // ★ ticketPrice 는 이제 모든 공연이 0 입니다(플랫폼이 대금에 관여하지 않으므로).
  //   그걸로 "무료 공연"을 세면 3만원 공연까지 무료로 집계됩니다. 대신 "우리가
  //   참석 예정을 받는 공연"(우리 무대)을 셉니다 — 배너의 실제 의미가 그것입니다.
  const ownUpcomingCount = useMemo(
    () => upcoming.filter((a) => a.show.source === 'own').length,
    [upcoming],
  )
  const showDiscoveryFeed = view === 'list' && !filter.query.trim()

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
            origin={origin}
            center={mapCenter}
            // 지도/리스트 토글이 top-[136px] 에 높이 40 으로 있습니다. 그 아래로.
            controlsTop={188}
            onSearchHere={(center) => {
              setSearchCenter(center)
              setSelectedId(null)
              // 이 지역을 보고 싶다는 뜻이므로 거리 제한은 풉니다
              setFilter({ distance: 0 })
              setSnap(1)
            }}
            selectedId={selectedId}
            onSelect={setSelectedId}
            highlightShowId={highlightShowId}
          />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-y-auto px-4 pt-[132px]">
          {showDiscoveryFeed && (
            <>
              <OwnShowsBanner count={ownUpcomingCount} onClick={() => setFilter({ ownOnly: true })} />
              <RecentlyViewedRow items={recentlyViewed} nowIso={nowIso} onOpen={openShow} />
              <TrendingRow items={trendingShows} nowIso={nowIso} onOpen={openShow} />
              <h2 className="mb-2.5 text-[15px] font-bold">내 주변 공연</h2>
            </>
          )}
          <ResultList
            results={results}
            nowIso={nowIso}
            likedShowIds={likedShowIds}
            onToggleLike={toggleLike}
            onOpen={openShow}
            highlightShowId={highlightShowId}
            onReset={() => setFilter(DEFAULT_FILTER)}
            loading={loading}
            error={error}
            onRetry={refresh}
            hasAnyShow={all.length > 0}
            relax={relax}
            onRelax={setFilter}
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
                    filter.genres.length > 0 || filter.ownOnly
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
          {/* ★ 날짜별 보기. "다음 주 토요일에 뭐 하지"가 이 서비스에서 가장
              자연스러운 질문인데 물을 방법이 없었습니다. 개수는 조건 적용 전
              전체(all)로 세서, 조건을 좁힐 때마다 달력 숫자가 흔들리지 않게 합니다. */}
          <div className="mt-2.5">
            <DateStrip
              items={scoped}
              value={filter.date ?? null}
              onChange={(date) => setFilter({ date })}
              nowIso={nowIso}
            />
          </div>
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
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
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
          heights={[...SHEET_HEIGHTS]}
          header={
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-[15px] font-bold">
                  이 지역 공연 <span className="tnum">{results.length}</span>건
                  {searchCenter && (
                    <button
                      onClick={() => setSearchCenter(null)}
                      className="rounded-full border border-border px-1.5 py-0.5 text-2xs font-semibold text-ink-3"
                    >
                      내 주변으로
                    </button>
                  )}
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
              loading={loading}
              error={error}
              onRetry={refresh}
              hasAnyShow={all.length > 0}
              relax={relax}
              onRelax={setFilter}
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
  loading,
  error,
  onRetry,
  hasAnyShow,
  relax,
  onRelax,
}: {
  results: ReturnType<typeof filterShows>
  nowIso: string
  likedShowIds: string[]
  onToggleLike: (id: string) => void
  onOpen: (id: string) => void
  highlightShowId: string | null
  onReset: () => void
  loading: boolean
  error: string | null
  onRetry: () => void
  /** 필터를 걷어내면 공연이 하나라도 있는지 — 빈 상태 문구를 가르는 기준 */
  hasAnyShow: boolean
  /** 조건을 한 단계 풀면 몇 건이 나오는지 */
  relax?: { label: string; patch: Partial<AudienceFilter>; count: number } | null
  onRelax?: (patch: Partial<AudienceFilter>) => void
}) {
  if (loading) {
    return (
      <div className="space-y-2.5 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        art="search"
        title="공연을 불러오지 못했어요"
        description={error}
        action={
          <button
            onClick={onRetry}
            className="rounded-xl border border-border-strong px-4 py-2.5 text-xs font-bold"
          >
            다시 시도
          </button>
        }
      />
    )
  }

  // 데이터가 정말 하나도 없는 것과, 필터가 좁아서 0건인 것은 다른 상황입니다.
  // 오픈 직후에는 전자가 정상 상태이므로 다음 행동(공간 등록)으로 안내합니다.
  if (results.length === 0 && !hasAnyShow) {
    return <NoStagesYet />
  }

  if (results.length === 0) {
    return (
      <EmptyState
        art="search"
        title="이 조건에는 공연이 없어요"
        description={
          relax
            ? `${relax.label.replace(/ 보기$|하기$/, '')}면 ${relax.count}건이 있어요.`
            : '거리를 넓히거나 기간을 ‘전체’로 바꿔보세요.'
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* ★ 빈 화면만 보여주면 "공연이 없는 서비스"로 결론 내리고 떠납니다.
                무엇을 풀면 몇 건이 나오는지 한 번에 눌러 볼 수 있게 합니다. */}
            {relax && (
              <button
                onClick={() => onRelax?.(relax.patch)}
                className="bg-gold-500 rounded-xl px-4 py-2.5 text-xs font-bold text-gold-ink"
              >
                {relax.label} ({relax.count})
              </button>
            )}
            <button
              onClick={onReset}
              className="rounded-xl border border-border-strong px-4 py-2.5 text-xs font-bold"
            >
              필터 초기화
            </button>
          </div>
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

/**
 * 우리 무대가 아직 0건일 때.
 *
 * 데이터 0건은 예외가 아니라 오픈 직후의 정상 상태입니다. "없다"고만 말하지 않고
 * 다음 행동(공간 등록)으로 보냅니다. 등록 공연(KOPIS)은 계속 보이므로 지도가
 * 완전히 비지는 않습니다.
 */
function NoStagesYet() {
  const navigate = useNavigate()
  return (
    <EmptyState
      art="stage"
      title="아직 우리 동네 무대가 없어요"
      description="당신의 가게가 이 동네 첫 무대가 될 수 있습니다."
      action={
        <button
          onClick={() => navigate('/desktop/host/venue/new')}
          className="bg-gold-500 rounded-xl px-4 py-2.5 text-xs font-bold text-gold-ink"
        >
          공간 등록하기
        </button>
      }
    />
  )
}
