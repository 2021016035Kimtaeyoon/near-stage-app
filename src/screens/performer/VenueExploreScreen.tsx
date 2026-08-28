import { LayoutList, Map as MapIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VenueCard } from '@/components/cards/VenueCard'
import { VenueMapView } from '@/components/map/VenueMapView'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Chip, Toggle } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { distanceKm } from '@/lib/geo'
import { matchNeeds } from '@/lib/match'
import { useAppStore } from '@/store/useAppStore'
import type { DistanceFilter } from '@/types'

type FeeFilter = 'all' | 'free' | 'under50k'
type CapacityFilter = 'all' | '20' | '50'

export function VenueExploreScreen() {
  const navigate = useNavigate()
  const venues = useAppStore((s) => s.venues)
  const performer = useAppStore((s) =>
    s.performers.find((p) => p.id === s.currentPerformerId),
  )
  const [view, setView] = useState<'list' | 'map'>('list')
  const [fee, setFee] = useState<FeeFilter>('all')
  const [capacity, setCapacity] = useState<CapacityFilter>('all')
  const [distance, setDistance] = useState<DistanceFilter>(0)
  const [matchOnly, setMatchOnly] = useState(false)
  const [genreOnly, setGenreOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(() => {
    if (!performer) return []
    return venues.map((venue) => ({
      venue,
      distanceKm: distanceKm(DEFAULT_USER_LOCATION, { lat: venue.lat, lng: venue.lng }),
      match: matchNeeds(performer, venue),
    }))
  }, [venues, performer])

  const filtered = rows.filter(({ venue, distanceKm: d, match }) => {
    if (fee === 'free' && venue.rentalFee !== 0) return false
    if (fee === 'under50k' && venue.rentalFee > 50000) return false
    if (capacity === '20' && venue.capacity < 20) return false
    if (capacity === '50' && venue.capacity < 50) return false
    if (distance !== 0 && d > distance) return false
    if (matchOnly && !match.allSatisfied) return false
    if (genreOnly && performer && !venue.preferredGenres.includes(performer.genre)) return false
    return true
  })

  if (!performer) {
    return (
      <Screen>
        <ScreenHeader title="장소 탐색" />
        <EmptyState art="search" title="공연자 프로필을 찾을 수 없어요" />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader
        title="장소 탐색"
        subtitle={`내 조건(${performer.needs.length}개)과 자동 대조합니다`}
        right={
          <button
            onClick={() => setView(view === 'list' ? 'map' : 'list')}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-bold"
          >
            {view === 'list' ? <MapIcon size={14} /> : <LayoutList size={14} />}
            {view === 'list' ? '지도' : '리스트'}
          </button>
        }
      />

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3 pt-1">
        <Chip active={fee === 'free'} onClick={() => setFee(fee === 'free' ? 'all' : 'free')}>
          대여료 무료
        </Chip>
        <Chip active={fee === 'under50k'} onClick={() => setFee(fee === 'under50k' ? 'all' : 'under50k')}>
          5만원 이하
        </Chip>
        <Chip active={capacity === '20'} onClick={() => setCapacity(capacity === '20' ? 'all' : '20')}>
          20명 이상
        </Chip>
        <Chip active={capacity === '50'} onClick={() => setCapacity(capacity === '50' ? 'all' : '50')}>
          50명 이상
        </Chip>
        {([1, 2, 5] as DistanceFilter[]).map((d) => (
          <Chip key={d} active={distance === d} onClick={() => setDistance(distance === d ? 0 : d)}>
            {d}km
          </Chip>
        ))}
        <Chip brand active={genreOnly} onClick={() => setGenreOnly((v) => !v)}>
          내 장르({performer.genre})
        </Chip>
      </div>

      <div className="px-4 pb-2">
        <Toggle
          checked={matchOnly}
          onChange={setMatchOnly}
          label="조건 충족 공간만 보기"
          hint={`${filtered.filter((r) => r.match.allSatisfied).length}곳이 내 필요 조건을 모두 충족해요`}
        />
      </div>

      {view === 'map' ? (
        <div className="min-h-0 flex-1">
          <VenueMapView
            items={filtered.map((r) => ({ venue: r.venue, satisfied: r.match.allSatisfied }))}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              navigate(`/performer/venue/${id}`)
            }}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {filtered.length === 0 ? (
            <EmptyState art="search" title="조건에 맞는 공간이 없어요" description="필터를 조금 넓혀보세요." />
          ) : (
            <div className="space-y-2.5">
              {filtered.map(({ venue, distanceKm: d, match }) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  distanceKm={d}
                  match={match}
                  onClick={() => navigate(`/performer/venue/${venue.id}`)}
                />
              ))}
            </div>
          )}
          <TabBarSpacer />
        </div>
      )}
    </Screen>
  )
}
