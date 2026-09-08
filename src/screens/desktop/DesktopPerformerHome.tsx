import { CalendarCheck, CheckCircle2, MapPin, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Chip, Toggle } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyArtists } from '@/hooks/useMyResources'
import { useViewerLocation } from '@/hooks/usePublicShows'
import { usePublicVenues, type PublicVenue } from '@/hooks/usePublicVenues'
import { distanceKm } from '@/lib/geo'
import { matchNeeds } from '@/lib/needMatch'
import type { DistanceFilter } from '@/types'

/**
 * 데스크톱 홈 — 아티스트용.
 *
 * ★ 목 스토어를 읽어서 영구히 빈 화면이었습니다. 모바일 "장소 탐색"과 같은
 *   데이터를 읽고 넓은 화면에 맞게 그리드로 배치합니다.
 */
export function DesktopPerformerHome() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const origin = useViewerLocation()
  const venues = usePublicVenues()
  const artists = useMyArtists()
  const [distance, setDistance] = useState<DistanceFilter>(0)
  const [openOnly, setOpenOnly] = useState(false)
  const [matchOnly, setMatchOnly] = useState(false)

  const team = artists.data.find((a) => a.status === 'approved')
  const myNeeds = team?.needs ?? []

  const rows = venues.data
    .map((venue) => ({
      venue,
      d: distanceKm(origin, { lat: venue.lat, lng: venue.lng }),
      match: matchNeeds(myNeeds, venue.equipment),
    }))
    .filter(({ venue, d, match }) => {
      if (distance !== 0 && d > distance) return false
      if (openOnly && venue.openSlots === 0) return false
      if (matchOnly && match.missingCount > 0) return false
      return true
    })
    .sort((a, b) => a.d - b.d)

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          art="stage"
          title="로그인하면 조건에 맞는 공간을 찾아드려요"
          description="팀을 등록하면 필요 장비와 공간 장비를 자동으로 대조합니다."
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="text-2xl font-extrabold">
          {team ? `${team.teamName}님, 오늘은 어디서 공연할까요?` : '어디서 공연할까요?'}
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          {myNeeds.length > 0
            ? `팀이 적은 필요 장비 ${myNeeds.length}개를 공간 장비와 자동으로 대조합니다.`
            : '팀을 등록하고 필요 장비를 적어두시면 조건이 맞는 공간을 골라 드립니다.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {([1, 2, 5, 0] as DistanceFilter[]).map((d) => (
              <Chip key={d} active={distance === d} onClick={() => setDistance(d)}>
                {d === 0 ? '거리 전체' : `${d}km`}
              </Chip>
            ))}
          </div>
          <div className="w-52">
            <Toggle checked={openOnly} onChange={setOpenOnly} label="지원 가능한 곳만" />
          </div>
          {myNeeds.length > 0 && (
            <div className="w-52">
              <Toggle checked={matchOnly} onChange={setMatchOnly} label="조건 맞는 곳만" />
            </div>
          )}
          <span className="tnum ml-auto text-xs text-ink-3">{rows.length}곳</span>
        </div>

        {venues.loading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : venues.data.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              art="stage"
              title="공개된 공간이 아직 없어요"
              description="가게가 등록되면 여기에 뜹니다."
              action={
                <Button variant="outline" onClick={() => navigate('/desktop/performer/posts')}>
                  구인글 보기
                </Button>
              }
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              art="search"
              title="조건에 맞는 공간이 없어요"
              description="거리 조건을 넓혀보세요."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ venue, d, match }) => (
              <VenueGridCard
                key={venue.id}
                venue={venue}
                distanceKm={d}
                missing={myNeeds.length > 0 ? match.missingCount : null}
                onOpen={() => navigate(`/desktop/performer/venue/${venue.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VenueGridCard({
  venue,
  distanceKm: d,
  missing,
  onOpen,
}: {
  venue: PublicVenue
  distanceKm: number
  missing: number | null
  onOpen: () => void
}) {
  return (
    <button onClick={onOpen} className="card overflow-hidden text-left">
      {venue.photos[0] ? (
        <img
          src={venue.photos[0]}
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <span className="flex aspect-[4/3] w-full items-center justify-center bg-surface-2 text-ink-3">
          <MapPin size={24} />
        </span>
      )}
      <div className="p-3.5">
        <div className="flex items-center gap-1.5">
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
        </div>
        <p className="tnum mt-0.5 text-2xs text-ink-2">
          {venue.category} · 최대 {venue.capacity}명 · {d.toFixed(1)}km
        </p>
        <p className="mt-0.5 truncate text-2xs text-ink-3">{venue.address}</p>
        {missing !== null && (
          <p
            className={`mt-1.5 flex items-center gap-1 text-2xs font-semibold ${
              missing === 0 ? 'text-ok' : 'text-warn'
            }`}
          >
            {missing === 0 ? <CheckCircle2 size={11} /> : <TriangleAlert size={11} />}
            {missing === 0 ? '우리 팀 조건을 다 갖춘 곳' : `장비 ${missing}개 부족`}
          </p>
        )}
      </div>
    </button>
  )
}
