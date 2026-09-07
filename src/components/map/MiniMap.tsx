import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { cn } from '@/lib/cn'
import type { Genre } from '@/types'
import { venueMarkerIcon } from './markers'

/** 상세 화면용 — 인터랙션 없는 작은 정적 지도 (마커 하나) */
export function MiniMap({
  lat,
  lng,
  genre,
  className,
}: {
  lat: number
  lng: number
  genre: Genre | null
  className?: string
}) {
  return (
    <div className={cn('map-offline-grid relative overflow-hidden rounded-xl', className)}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
        className="h-full w-full"
        style={{ background: 'transparent' }}
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Marker position={[lat, lng]} icon={venueMarkerIcon(genre, true, true)} interactive={false} />
      </MapContainer>
    </div>
  )
}
