import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { DEFAULT_MAP_CENTER } from '@/config/brand'
import { cn } from '@/lib/cn'
import type { ShowWithMeta } from '@/store/selectors'
import { MapControls } from './MapControls'
import { showMarkerIcon, userMarkerIcon } from './markers'

interface Props {
  items: ShowWithMeta[]
  /** 내 위치. 브라우저에서만 계산하고 서버로 보내지 않습니다 */
  origin?: { lat: number; lng: number }
  /** 보이는 지역으로 다시 찾기 */
  onSearchHere?: (center: { lat: number; lng: number }, radiusKm: number) => void
  /** 조작 버튼을 위에서 내릴 높이(px). 검색 바를 피하도록 부르는 쪽이 정합니다 */
  controlsTop?: number
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
  origin = DEFAULT_MAP_CENTER,
  onSearchHere,
  controlsTop,
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
    // ★ isolate 가 핵심입니다. Leaflet 은 내부 pane 에 z-index 200~800 을 직접 넣는데,
    //   이 컨테이너가 스태킹 컨텍스트를 만들지 않으면 그 pane 들이 바깥 형제 요소와
    //   같은 층에서 경쟁합니다. 그래서 지도 위에 올린 바텀시트(z-30)가 타일·마커에
    //   가려져 "지도만 뜨는" 것처럼 보였습니다.
    <div
      className={cn(
        'relative isolate h-full w-full',
        tilesFailed && 'map-offline-grid',
        className,
      )}
    >
      <MapContainer
        center={[origin.lat, origin.lng]}
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
          position={[origin.lat, origin.lng]}
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
        <MapControls origin={origin} onSearchHere={onSearchHere} topOffset={controlsTop} />
      </MapContainer>

      {tilesFailed && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-2xs font-semibold text-ink-2 backdrop-blur">
          오프라인 · 지도 타일 없이 표시 중
        </div>
      )}
    </div>
  )
}
