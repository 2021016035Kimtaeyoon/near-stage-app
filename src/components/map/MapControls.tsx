import { LocateFixed, Minus, Plus, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

/**
 * 지도 조작 (§QA).
 *
 * ★ 예전에는 지도에 아무 조작 수단이 없었습니다. 확대·축소는 두 손가락으로 되지만,
 *   "내 위치로 돌아가기"가 없어서 한 번 멀리 밀면 되돌아올 방법이 없었습니다.
 *
 * ★ 지도를 옮기면 "이 지역에서 찾기"가 뜹니다. 옮긴 만큼 결과가 자동으로 바뀌면
 *   보고 있던 목록이 손을 뗄 때마다 흔들려서 읽을 수가 없습니다. 누를 때만 바꿉니다.
 *
 * ★ 버튼은 z-[500] 입니다. Leaflet 내부 pane 이 200~800 을 쓰기 때문에 그보다
 *   낮으면 타일에 묻힙니다. 컨테이너가 isolate 라 바깥에는 영향을 주지 않습니다.
 */
export function MapControls({
  origin,
  initialCenter,
  onSearchHere,
  topOffset = 24,
}: {
  /** 내 위치 (브라우저에서만 계산합니다 — 서버로 보내지 않습니다) */
  origin: { lat: number; lng: number }
  /**
   * 처음 맞출 위치. 보통 "가장 가까운 공연"입니다.
   *
   * ★ 내 위치로 열면 근처에 공연이 없을 때 빈 지도가 뜹니다. 처음은 공연이
   *   보이는 곳에서 시작하고, "내 위치로" 버튼은 그대로 내 위치로 갑니다.
   */
  initialCenter?: { lat: number; lng: number }
  /** 보이는 지역으로 다시 찾기. 지도 중심과 반경(km)을 넘깁니다 */
  onSearchHere?: (center: { lat: number; lng: number }, radiusKm: number) => void
  /**
   * 버튼을 위에서 얼마나 내릴지(px).
   *
   * ★ 처음에는 바닥 기준으로 뒀는데 바텀시트가 덮었습니다. 시트 높이는 스냅
   *   단계마다 달라지고 헤더까지 포함돼서 바깥에서 정확히 알기 어렵습니다.
   *   위쪽은 검색 바 높이만 피하면 되고 그건 고정값이라, 상단 기준이 안전합니다.
   */
  topOffset?: number
}) {
  const map = useMap()
  const [moved, setMoved] = useState(false)

  useMapEvents({
    dragend: () => setMoved(true),
    zoomend: () => setMoved(true),
  })

  // 내 위치를 알게 되면(권한 허용) 한 번 그쪽으로 맞춰줍니다
  const first = initialCenter ?? origin
  useEffect(() => {
    map.setView([first.lat, first.lng], map.getZoom(), { animate: false })
    setMoved(false)
  }, [map, first.lat, first.lng])

  const toOrigin = () => {
    map.flyTo([origin.lat, origin.lng], 15, { duration: 0.6 })
    setMoved(false)
  }

  const searchHere = () => {
    const c = map.getCenter()
    // 화면 세로 절반을 반경으로 봅니다 — 보이는 만큼만 찾는다는 뜻입니다
    const b = map.getBounds()
    const radiusKm = c.distanceTo(b.getNorth ? { lat: b.getNorth(), lng: c.lng } : c) / 1000
    onSearchHere?.({ lat: c.lat, lng: c.lng }, Math.max(0.5, Math.round(radiusKm * 10) / 10))
    setMoved(false)
  }

  return (
    <>
      {moved && onSearchHere && (
        <button
          onClick={searchHere}
          style={{ top: topOffset }}
          className="absolute left-1/2 z-[500] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3.5 py-2 text-2xs font-bold shadow-lg backdrop-blur"
        >
          <Search size={12} />
          이 지역에서 찾기
        </button>
      )}

      <div className="absolute right-3 z-[500] flex flex-col gap-1.5" style={{ top: topOffset }}>
        <button
          onClick={toOrigin}
          aria-label="내 위치로"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/95 text-ink-2 shadow-md backdrop-blur active:bg-surface-2"
        >
          <LocateFixed size={16} />
        </button>
        <button
          onClick={() => map.zoomIn()}
          aria-label="확대"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/95 text-ink-2 shadow-md backdrop-blur active:bg-surface-2"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => map.zoomOut()}
          aria-label="축소"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/95 text-ink-2 shadow-md backdrop-blur active:bg-surface-2"
        >
          <Minus size={16} />
        </button>
        {moved && (
          <button
            onClick={toOrigin}
            aria-label="처음 위치로"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/95 text-ink-3 shadow-md backdrop-blur active:bg-surface-2"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>
    </>
  )
}
