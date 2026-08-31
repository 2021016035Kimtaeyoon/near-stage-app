import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VenueCard } from '@/components/cards/VenueCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Chip, Toggle } from '@/components/ui/Chip'
import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { distanceKm } from '@/lib/geo'
import { matchNeeds } from '@/lib/match'
import { useAppStore } from '@/store/useAppStore'
import type { DistanceFilter } from '@/types'

/** 데스크톱 홈 — 공연자용. 조건 충족 여부가 자동 계산된 공간 탐색 그리드 */
export function DesktopPerformerHome() {
  const navigate = useNavigate()
  const venues = useAppStore((s) => s.venues)
  const performer = useAppStore((s) => s.performers.find((p) => p.id === s.currentPerformerId))
  const [distance, setDistance] = useState<DistanceFilter>(0)
  const [matchOnly, setMatchOnly] = useState(false)

  const rows = useMemo(() => {
    if (!performer) return []
    return venues.map((venue) => ({
      venue,
      distanceKm: distanceKm(DEFAULT_USER_LOCATION, { lat: venue.lat, lng: venue.lng }),
      match: matchNeeds(performer, venue),
    }))
  }, [venues, performer])

  const filtered = rows.filter(
    (r) => (distance === 0 || r.distanceKm <= distance) && (!matchOnly || r.match.allSatisfied),
  )

  if (!performer) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState art="search" title="아티스트 프로필을 찾을 수 없어요" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="text-2xl font-extrabold">{performer.teamName}님, 오늘은 어디서 공연할까요?</h1>
        <p className="mt-1 text-sm text-ink-2">
          내 프로필의 필요 조건({performer.needs.length}개)과 공간 장비를 자동으로 대조합니다.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {([1, 2, 5, 0] as DistanceFilter[]).map((d) => (
              <Chip key={d} active={distance === d} onClick={() => setDistance(d)}>
                {d === 0 ? '거리 전체' : `${d}km`}
              </Chip>
            ))}
          </div>
          <div className="w-56">
            <Toggle checked={matchOnly} onChange={setMatchOnly} label="조건 충족 공간만" />
          </div>
          <span className="tnum ml-auto text-xs text-ink-3">
            {filtered.filter((r) => r.match.allSatisfied).length}/{filtered.length}곳이 조건을 모두 충족해요
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      </div>
    </div>
  )
}
