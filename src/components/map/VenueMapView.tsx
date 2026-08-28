import { useEffect, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { userMarkerIcon, venueMarkerIcon } from './markers'
import type { Venue } from '@/types'

interface VenueWithMatch {
  venue: Venue
  satisfied: boolean
}

function FitOnce() {
  const leaflet = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    window.setTimeout(() => leaflet.invalidateSize(), 60)
  }, [leaflet])
  return null
}

/** 공연자용 — 장소 탐색 지도. 조건 충족 여부를 마커 색으로 구분(라벨도 함께) */
export function VenueMapView({
  items,
  selectedId,
  onSelect,
}: {
  items: VenueWithMatch[]
  selectedId: string | null
  onSelect: (venueId: string) => void
}) {
  return (
    <MapContainer
      center={[DEFAULT_USER_LOCATION.lat, DEFAULT_USER_LOCATION.lng]}
      zoom={14}
      zoomControl={false}
      className="h-full w-full"
      style={{ background: 'transparent' }}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      <Marker
        position={[DEFAULT_USER_LOCATION.lat, DEFAULT_USER_LOCATION.lng]}
        icon={userMarkerIcon()}
        interactive={false}
      />
      {items.map(({ venue, satisfied }) => (
        <Marker
          key={venue.id}
          position={[venue.lat, venue.lng]}
          icon={venueMarkerIcon(venue.preferredGenres[0] ?? '밴드', venue.id === selectedId, satisfied)}
          eventHandlers={{ click: () => onSelect(venue.id) }}
        />
      ))}
      <FitOnce />
    </MapContainer>
  )
}
