import { CalendarCheck, CheckCircle2, MapPin, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Chip, Toggle } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyArtists } from '@/hooks/useMyResources'
import { usePublicVenues, type PublicVenue } from '@/hooks/usePublicVenues'
import { useViewerLocation } from '@/hooks/usePublicShows'
import { distanceKm } from '@/lib/geo'
import { matchNeeds } from '@/lib/needMatch'
import type { DistanceFilter } from '@/types'

type CapacityFilter = 'all' | '20' | '50'

/**
 * 장소 탐색 (아티스트 메인 탭).
 *
 * ★ 이 화면이 목 스토어를 읽고 있어서 영구히 빈 화면이었습니다. 아티스트가 두 번째
 *   탭을 누르면 아무것도 없었습니다.
 *
 * ★ 거리는 브라우저 좌표로 여기서만 계산하고 서버로 보내지 않습니다.
 *
 * 슬롯이 하나도 안 열린 공간도 보여줍니다. 지금 지원은 못 하지만 "이런 곳이 있다"를
 * 알아야 나중에 다시 볼 수 있어서요. 대신 카드에 열린 시간 수를 적어 헛걸음을 줄입니다.
 */
export function VenueExploreScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const origin = useViewerLocation()
  const venues = usePublicVenues()
  const artists = useMyArtists()

  const [capacity, setCapacity] = useState<CapacityFilter>('all')
  const [distance, setDistance] = useState<DistanceFilter>(0)
  const [openOnly, setOpenOnly] = useState(false)
  const [matchOnly, setMatchOnly] = useState(false)

  // 대조 기준은 내 첫 팀입니다. 팀이 없으면 대조 없이 목록만 봅니다
  const myNeeds = artists.data.find((a) => a.status === 'approved')?.needs ?? []

  const rows = venues.data
    .map((venue) => ({
      venue,
      d: distanceKm(origin, { lat: venue.lat, lng: venue.lng }),
      match: matchNeeds(myNeeds, venue.equipment),
    }))
    .filter(({ venue, d, match }) => {
      if (capacity === '20' && venue.capacity < 20) return false
      if (capacity === '50' && venue.capacity < 50) return false
      if (distance !== 0 && d > distance) return false
      if (openOnly && venue.openSlots === 0) return false
      if (matchOnly && match.missingCount > 0) return false
      return true
    })
    .sort((a, b) => a.d - b.d)

  return (
    <Screen>
      <ScreenHeader title="장소 탐색" subtitle="설 수 있는 무대를 찾습니다" />
      <ScreenBody>
        <div className="mb-3 space-y-2.5">
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {([0, 2, 5, 10] as DistanceFilter[]).map((v) => (
              <Chip key={v} active={distance === v} onClick={() => setDistance(v)}>
                {v === 0 ? '거리 전체' : `${v}km`}
              </Chip>
            ))}
            {(['all', '20', '50'] as CapacityFilter[]).map((v) => (
              <Chip key={v} active={capacity === v} onClick={() => setCapacity(v)}>
                {v === 'all' ? '규모 전체' : `${v}명 이상`}
              </Chip>
            ))}
          </div>

          <div className="card space-y-2.5 p-3">
            <Toggle
              checked={openOnly}
              onChange={setOpenOnly}
              label="지금 지원 가능한 곳만"
              hint="가능 시간이 열려 있는 공간"
            />
            {myNeeds.length > 0 && (
              <Toggle
                checked={matchOnly}
                onChange={setMatchOnly}
                label="장비 조건이 맞는 곳만"
                hint="우리 팀이 적은 필요 장비를 모두 갖춘 공간"
              />
            )}
          </div>
        </div>

        {venues.loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : venues.error ? (
          <EmptyState
            art="search"
            title="불러오지 못했어요"
            description={venues.error}
            action={
              <Button variant="outline" onClick={venues.refresh}>
                다시 시도
              </Button>
            }
          />
        ) : venues.data.length === 0 ? (
          <EmptyState
            art="stage"
            title="공개된 공간이 아직 없어요"
            description="가게가 등록되면 여기에 뜹니다. 구인글 탭도 같이 확인해보세요."
            action={
              <Button variant="outline" onClick={() => navigate('/performer/posts')}>
                구인글 보기
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            art="search"
            title="조건에 맞는 공간이 없어요"
            description="거리나 규모 조건을 넓혀보세요."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setDistance(0)
                  setCapacity('all')
                  setOpenOnly(false)
                  setMatchOnly(false)
                }}
              >
                조건 초기화
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-2 text-2xs text-ink-3">
              가까운 순 {rows.length}곳
              {!userId && ' · 로그인하면 우리 팀 조건과 대조해 드려요'}
            </p>
            <div className="space-y-2.5">
              {rows.map(({ venue, d, match }) => (
                <VenueRow
                  key={venue.id}
                  venue={venue}
                  distanceKm={d}
                  missing={myNeeds.length > 0 ? match.missingCount : null}
                  onOpen={() => navigate(`/performer/venue/${venue.id}`)}
                />
              ))}
            </div>
          </>
        )}

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function VenueRow({
  venue,
  distanceKm: d,
  missing,
  onOpen,
}: {
  venue: PublicVenue
  distanceKm: number
  /** 부족한 장비 수. 대조 기준이 없으면 null */
  missing: number | null
  onOpen: () => void
}) {
  return (
    <button onClick={onOpen} className="card flex w-full gap-3 p-3.5 text-left">
      {venue.photos[0] ? (
        <img
          src={venue.photos[0]}
          alt=""
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
          <MapPin size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{venue.name}</span>
          {venue.openSlots > 0 ? (
            <Tag tone="ok">
              <span className="inline-flex items-center gap-1">
                <CalendarCheck size={9} />
                {venue.openSlots}
              </span>
            </Tag>
          ) : (
            <Tag>시간 미개방</Tag>
          )}
        </span>
        <span className="tnum mt-0.5 block text-2xs text-ink-2">
          {venue.category} · 최대 {venue.capacity}명 · {d.toFixed(1)}km
        </span>
        <span className="mt-0.5 block truncate text-2xs text-ink-3">{venue.address}</span>
        {missing !== null && (
          <span
            className={`mt-1 flex items-center gap-1 text-2xs font-semibold ${
              missing === 0 ? 'text-ok' : 'text-warn'
            }`}
          >
            {missing === 0 ? <CheckCircle2 size={11} /> : <TriangleAlert size={11} />}
            {missing === 0 ? '우리 팀 조건을 다 갖춘 곳' : `장비 ${missing}개 부족`}
          </span>
        )}
      </span>
    </button>
  )
}
