import { BellPlus, Check, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShowCard } from '@/components/cards/ShowCard'
import { MapView } from '@/components/map/MapView'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { SERVICE_NAME } from '@/config/brand'
import { cn } from '@/lib/cn'
import { sameSavedFilter, toSavedFilter } from '@/lib/savedSearch'
import { distanceKm } from '@/lib/geo'
import { computeTrendingKeywords } from '@/lib/trending'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyLikes } from '@/hooks/useEngagement'
import { usePublicShows, useViewerLocation } from '@/hooks/usePublicShows'
import { DEFAULT_FILTER, filterShows } from '@/store/selectors'
import { useAppStore, useNow } from '@/store/useAppStore'
import type { SortKey } from '@/types'
import { TrendingSearchPanel } from '../audience/TrendingSearchPanel'
import { DesktopShowDetailModal } from './DesktopShowDetailModal'

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'soon', label: '임박순' },
  { value: 'near', label: '거리순' },
  { value: 'rating', label: '별점순' },
  { value: 'likes', label: '인기순' },
  { value: 'recommend', label: '추천순' },
]

/** 데스크톱 홈 — 관객용. 좌측 리스트 + 우측 대형 지도의 2단 레이아웃 */
export function DesktopAudienceHome() {
  const navigate = useNavigate()
  const { data: all, loading, error, refresh } = usePublicShows()
  // 좋아요는 내 계정에 저장됩니다 (§12)
  const likes = useMyLikes()
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const likedShowIds = likes.data
  const toggleLike = (id: string) => requireAuth(() => void likes.toggle(id))
  const nowIso = useNow()
  const filter = useAppStore((s) => s.audienceFilter)
  const setFilter = useAppStore((s) => s.setAudienceFilter)
  const highlightShowId = useAppStore((s) => s.highlightShowId)
  const savedSearches = useAppStore((s) => s.savedSearches)
  const saveCurrentSearch = useAppStore((s) => s.saveCurrentSearch)
  const applySavedSearch = useAppStore((s) => s.applySavedSearch)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailShowId, setDetailShowId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  // 모바일 홈과 같은 방식 — 지도를 옮긴 뒤 누르면 그 지점 기준으로 다시 찾습니다
  const viewerOrigin = useViewerLocation()
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null)
  const origin = searchCenter ?? viewerOrigin
  const searchRef = useRef<HTMLDivElement>(null)

  // 검색 영역 바깥을 클릭하면 트렌드 패널을 닫습니다.
  // onBlur+setTimeout 방식은 클릭 타이밍에 따라 트렌드 검색어 클릭이 씹힐 수 있어
  // 더 견고한 "바깥 클릭 감지"로 대체했습니다.
  useEffect(() => {
    if (!searchOpen) return
    const handlePointerDown = (e: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [searchOpen])

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
  const trending = useMemo(() => computeTrendingKeywords(all), [all])

  const ownCount = results.filter((r) => r.show.source === 'own').length
  // 지금 필터가 저장해 둔 조건과 같으면 저장 버튼을 "저장됨"으로 잠급니다
  const savedMatch = savedSearches.find((s) => sameSavedFilter(s.filter, toSavedFilter(filter)))
  const kopisCount = results.length - ownCount

  return (
    <div className="relative flex h-full w-full">
      <div className="flex w-[420px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface">
        <div ref={searchRef} className="space-y-3 border-b border-border p-5">
          <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface-2/70 px-3.5 transition-colors focus-within:border-border-strong focus-within:bg-surface">
            <Search size={15} className="shrink-0 text-ink-3" />
            <input
              value={filter.query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => setFilter({ query: e.target.value })}
              placeholder={`${SERVICE_NAME} · 팀 이름, 공간, 장르 검색`}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
            />
          </div>

          {searchOpen && !filter.query.trim() && (
            <TrendingSearchPanel
              keywords={trending}
              onSelect={(term) => {
                setFilter({ query: term })
                setSearchOpen(false)
              }}
            />
          )}

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            <Chip active={filter.when === 'tonight'} onClick={() => setFilter({ when: 'tonight' })}>
              오늘 밤
            </Chip>
            <Chip active={filter.when === 'weekend'} onClick={() => setFilter({ when: 'weekend' })}>
              주말
            </Chip>
            <Chip active={filter.when === 'all'} onClick={() => setFilter({ when: 'all' })}>
              전체 기간
            </Chip>
            <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden />
            {([1, 2, 5, 0] as const).map((d) => (
              <Chip key={d} active={filter.distance === d} onClick={() => setFilter({ distance: d })}>
                {d === 0 ? '거리 전체' : `${d}km`}
              </Chip>
            ))}
            <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden />
            <Chip brand active={filter.ownOnly} onClick={() => setFilter({ ownOnly: !filter.ownOnly })}>
              우리 무대만
            </Chip>
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {SORT_OPTIONS.map((o) => (
              <Chip key={o.value} active={filter.sort === o.value} onClick={() => setFilter({ sort: o.value })}>
                {o.label}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            <button
              onClick={() => saveCurrentSearch()}
              disabled={!!savedMatch}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors',
                savedMatch
                  ? 'border-border bg-surface-2 text-ink-3'
                  : 'border-border-strong bg-surface text-ink active:bg-surface-2',
              )}
            >
              {savedMatch ? <Check size={13} /> : <BellPlus size={13} />}
              {savedMatch ? '관심 조건 저장됨' : '이 조건 저장'}
            </button>
            {savedSearches.map((s) => (
              <Chip
                key={s.id}
                active={savedMatch?.id === s.id}
                onClick={() => applySavedSearch(s.id)}
              >
                {s.name}
              </Chip>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs font-bold text-ink">
              이 지역 공연 <span className="tnum text-gold-text">{results.length}</span>건
            </p>
            <p className="tnum text-2xs text-ink-3">
              우리 무대 {ownCount} · 등록 공연 {kopisCount}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-surface-2" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              art="search"
              title="공연을 불러오지 못했어요"
              description={error}
              action={
                <button
                  onClick={refresh}
                  className="rounded-xl border border-border-strong px-4 py-2.5 text-xs font-bold"
                >
                  다시 시도
                </button>
              }
            />
          ) : results.length === 0 && all.length === 0 ? (
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
          ) : results.length === 0 ? (
            <EmptyState
              art="search"
              title="조건에 맞는 공연이 없어요"
              description="거리를 넓히거나 기간을 '전체'로 바꿔보세요."
              action={
                <button
                  onClick={() => setFilter(DEFAULT_FILTER)}
                  className="rounded-xl border border-border-strong px-4 py-2.5 text-xs font-bold"
                >
                  필터 초기화
                </button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {results.map((item) => (
                <ShowCard
                  key={item.show.id}
                  item={item}
                  nowIso={nowIso}
                  liked={likedShowIds.includes(item.show.id)}
                  onToggleLike={() => toggleLike(item.show.id)}
                  onClick={() => setDetailShowId(item.show.id)}
                  highlighted={item.show.id === highlightShowId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card m-4 min-w-0 flex-1 overflow-hidden">
        <MapView
          items={results}
          origin={origin}
          controlsTop={16}
          onSearchHere={(center) => {
            setSearchCenter(center)
            setSelectedId(null)
            setFilter({ distance: 0 })
          }}
          selectedId={selectedId}
          onSelect={setSelectedId}
          highlightShowId={highlightShowId}
        />
      </div>

      <DesktopShowDetailModal showId={detailShowId} onClose={() => setDetailShowId(null)} />
    </div>
  )
}
