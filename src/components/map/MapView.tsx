import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { cn } from '@/lib/cn'
import type { ShowWithMeta } from '@/store/selectors'
import { showMarkerIcon, userMarkerIcon } from './markers'

interface Props {
  items: ShowWithMeta[]
  selectedId: string | null
  onSelect: (showId: string | null) => void
  highlightShowId?: string | null
  className?: string
  /** 지도 준비 완료 시 인스턴스 전달 */
  onReady?: (map: LeafletMap) => void
}

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; OpenStreetMap'

/** 선택된 마커로 부드럽게 이동 */
function MapEffects({
  selected,
  onReady,
}: {
  selected: ShowWithMeta | null
  onReady?: (map: LeafletMap) => void
}) {
  const map = useMap()
  const readyRef = useRef(false)

  useEffect(() => {
    if (readyRef.current) return
    readyRef.current = true
    // 프레임 크기 확정 후 레이아웃 재계산
    const t = window.setTimeout(() => map.invalidateSize(), 60)
    onReady?.(map)
    return () => window.clearTimeout(t)
  }, [map, onReady])

  useEffect(() => {
    if (!selected) return
    map.panTo([selected.place.lat, selected.place.lng], { animate: true, duration: 0.4 })
  }, [map, selected])

  return null
}

export function MapView({
  items,
  selectedId,
  onSelect,
  highlightShowId = null,
  className,
  onReady,
}: Props) {
  const [tilesFailed, setTilesFailed] = useState(false)
  const errorCount = useRef(0)

  const selected = useMemo(
    () => items.find((i) => i.show.id === selectedId) ?? null,
    [items, selectedId],
  )

  return (
    <div className={cn('relative h-full w-full', tilesFailed && 'map-offline-grid', className)}>
      <MapContainer
        center={[DEFAULT_USER_LOCATION.lat, DEFAULT_USER_LOCATION.lng]}
        zoom={15}
        zoomControl={false}
        attributionControl
        className="h-full w-full"
        style={{ background: 'transparent' }}
      >
        <TileLayer
          url={TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              errorCount.current += 1
              if (errorCount.current >= 3) setTilesFailed(true)
            },
            tileload: () => {
              if (errorCount.current > 0) errorCount.current = 0
            },
          }}
        />

        <Marker
          position={[DEFAULT_USER_LOCATION.lat, DEFAULT_USER_LOCATION.lng]}
          icon={userMarkerIcon()}
          interactive={false}
        />

        {items.map((item) => (
          <Marker
            key={item.show.id}
            position={[item.place.lat, item.place.lng]}
            zIndexOffset={
              item.show.id === selectedId ? 1000 : item.show.source === 'own' ? 400 : 100
            }
            icon={showMarkerIcon({
              genre: item.show.genre,
              source: item.show.source,
              selected: item.show.id === selectedId,
              popped: item.show.id === highlightShowId,
            })}
            eventHandlers={{
              click: () => onSelect(item.show.id === selectedId ? null : item.show.id),
            }}
          />
        ))}

        <MapEffects selected={selected} onReady={onReady} />
      </MapContainer>

      {tilesFailed && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-2xs font-semibold text-ink-2 backdrop-blur">
          오프라인 · 지도 타일 없이 표시 중
        </div>
      )}
    </div>
  )
}
