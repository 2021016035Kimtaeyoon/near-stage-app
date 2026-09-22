import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'

/**
 * 지도에서 핀 위치 확정.
 *
 * 주소 검색이 찍어준 좌표는 건물 중심이라, 실제 출입구나 공연하는 자리와 다를 수
 * 있습니다. 관객이 찾아오는 지점이 정확해야 하므로 사장님이 직접 옮기게 합니다.
 *
 * ★ 지도 라이브러리를 두 개 태우지 않기 위해 카카오 지도가 아니라 앱이 이미 쓰는
 *   Leaflet/OSM 을 씁니다. 카카오 SDK 는 주소→좌표 변환에만 씁니다.
 */
const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:34px;height:34px;margin-left:-17px;margin-top:-34px;
    display:flex;align-items:center;justify-content:center;
    background:rgb(var(--color-gold-500));border:2px solid #0A0A0D;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);box-shadow:0 6px 14px rgba(0,0,0,.35)">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1">📍</span>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [0, 0],
})

/** 부모가 좌표를 바꿨을 때 지도를 따라가게 합니다 (주소 재검색 등) */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const last = useRef<string>('')
  useEffect(() => {
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`
    if (last.current === key) return
    last.current = key
    map.setView([lat, lng], map.getZoom() < 16 ? 17 : map.getZoom())
  }, [lat, lng, map])
  return null
}

/** 지도를 눌러도 핀이 옮겨지게 합니다 — 드래그보다 이게 편할 때가 많습니다 */
function ClickToMove({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => onMove(e.latlng.lat, e.latlng.lng)
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map, onMove])
  return null
}

export function PinPicker({
  lat,
  lng,
  onMove,
  className,
}: {
  lat: number
  lng: number
  onMove: (lat: number, lng: number) => void
  className?: string
}) {
  return (
    <div className={className}>
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full rounded-2xl"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Recenter lat={lat} lng={lng} />
        <ClickToMove onMove={onMove} />
        <Marker
          position={[lat, lng]}
          icon={PIN_ICON}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng()
              onMove(p.lat, p.lng)
            },
          }}
        />
      </MapContainer>
    </div>
  )
}
