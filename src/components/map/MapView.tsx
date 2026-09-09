import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  /**
   * 지도가 처음 열릴 위치. 내 위치(origin)와 다를 수 있습니다.
   *
   * ★ 예전에는 항상 내 위치(권한 없으면 연남동)를 중심으로 열었습니다. 실제
   *   공연이 안산에 있으면 지도가 서울을 보여주고 핀이 하나도 안 보입니다.
   *   "가장 가까운 공연"을 중심으로 열어야 첫 화면에 무대가 보입니다.
   */
  center?: { lat: number; lng: number }
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

/**
 * 한 화면에 그릴 마커 상한.
 *
 * ★ 등록 공연이 862건이 되면서 마커를 전부 그리자 DOM 노드가 4만 개가 되고
 *   지도 전환에 6초가 걸렸습니다. 100건일 때는 안 보였던 문제입니다.
 *   실제 휴대폰에서는 못 씁니다.
 */
const MAX_MARKERS = 150

/**
 * 지금 화면에 보이는 공연만 마커로 그립니다.
 *
 * ★ 화면 밖 마커는 그려도 보이지 않습니다. 지도를 옮기면 다시 계산합니다.
 * ★ 그래도 상한을 넘으면 우리 무대를 먼저 남기고, 그다음 화면 중심에 가까운
 *   것을 남깁니다. 우리 무대가 등록 공연에 밀려 안 보이면 이 서비스가 무엇을
 *   하는 곳인지 지도에서 사라집니다.
 */
function ShowMarkers({
  items,
  selectedId,
  highlightShowId,
  onSelect,
  onVisibleCount,
}: {
  items: ShowWithMeta[]
  selectedId: string | null
  highlightShowId: string | null
  onSelect: (id: string | null) => void
  onVisibleCount: (shown: number, inView: number) => void
}) {
  const map = useMap()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const bump = () => setTick((n) => n + 1)
    map.on('moveend', bump)
    map.on('zoomend', bump)
    map.on('resize', bump)
    // 프레임 크기가 확정된 뒤 한 번 더 — 처음에는 bounds 가 0에 가깝습니다
    const t = window.setTimeout(bump, 120)
    return () => {
      map.off('moveend', bump)
      map.off('zoomend', bump)
      map.off('resize', bump)
      window.clearTimeout(t)
    }
  }, [map])

  const visible = useMemo(() => {
    void tick
    const b = map.getBounds()
    const inView = items.filter((i) => b.contains([i.place.lat, i.place.lng]))
    if (inView.length <= MAX_MARKERS) return { list: inView, inView: inView.length }
    const c = map.getCenter()
    const list = inView
      .map((i) => ({ i, d: c.distanceTo([i.place.lat, i.place.lng]) }))
      .sort((a, z) => {
        const ao = a.i.show.source === 'own' ? 0 : 1
        const zo = z.i.show.source === 'own' ? 0 : 1
        return ao !== zo ? ao - zo : a.d - z.d
      })
      .slice(0, MAX_MARKERS)
      .map((x) => x.i)
    return { list, inView: inView.length }
  }, [items, map, tick])

  useEffect(() => {
    onVisibleCount(visible.list.length, visible.inView)
  }, [visible, onVisibleCount])

  return (
    <>
      {visible.list.map((item) => (
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
    </>
  )
}

export function MapView({
  items,
  origin = DEFAULT_MAP_CENTER,
  onSearchHere,
  controlsTop,
  center,
  selectedId,
  onSelect,
  highlightShowId = null,
  className,
  onReady,
}: Props) {
  const [tilesFailed, setTilesFailed] = useState(false)
  const errorCount = useRef(0)
  const [shown, setShown] = useState({ drawn: 0, inView: 0 })
  // ★ useCallback 없이 넘기면 ShowMarkers 의 useEffect 가 매 렌더마다 다시 돌아
  //   setState -> 렌더 -> setState 로 무한히 돕니다.
  const handleVisibleCount = useCallback(
    (drawn: number, inView: number) =>
      setShown((p) => (p.drawn === drawn && p.inView === inView ? p : { drawn, inView })),
    [],
  )

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
        center={[(center ?? origin).lat, (center ?? origin).lng]}
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

        <ShowMarkers
          items={items}
          selectedId={selectedId}
          highlightShowId={highlightShowId}
          onSelect={onSelect}
          onVisibleCount={handleVisibleCount}
        />

        <MapEffects selected={selected} onReady={onReady} />
        <MapControls
          origin={origin}
          initialCenter={center ?? origin}
          onSearchHere={onSearchHere}
          topOffset={controlsTop}
        />
      </MapContainer>

      {/* ★ 마커를 다 못 그렸으면 숨기지 않고 말합니다. 지도에 30개만 보이는데
          목록에는 200건이 있으면 사용자는 지도가 고장난 줄 압니다. */}
      {shown.inView > shown.drawn && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[500] flex justify-center px-4">
          <p className="tnum rounded-full bg-ink/85 px-3 py-1.5 text-2xs font-bold text-bg">
            이 화면 {shown.inView}건 중 {shown.drawn}개만 표시 · 확대하면 다 보여요
          </p>
        </div>
      )}

      {tilesFailed && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-2xs font-semibold text-ink-2 backdrop-blur">
          오프라인 · 지도 타일 없이 표시 중
        </div>
      )}
    </div>
  )
}
