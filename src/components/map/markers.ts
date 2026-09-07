import L from 'leaflet'
import { BRAND_FROM, BRAND_TO, GENRE_COLOR, GENRE_GLYPH, KOPIS_LINE, alpha } from '@/lib/theme'
import type { Genre, ShowSource } from '@/types'

/**
 * 지도 마커.
 * `우리 무대` = 브랜드 그라데이션으로 채워진 원형 마커
 * `등록 공연` = 채우지 않고 얇은 외곽선만
 * 두 경우 모두 장르 픽토그램을 안에 그려 장르를 함께 전달합니다.
 */

interface Options {
  genre: Genre | null
  source: ShowSource
  selected: boolean
  /** 데모에서 방금 생성된 핀 — 팝 애니메이션 */
  popped?: boolean
}

function glyphSvg(genre: Genre | null, size: number, color: string, width: number): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${GENRE_GLYPH[genre ?? '연극']}"/></svg>`
}

export function showMarkerIcon({ genre, source, selected, popped = false }: Options): L.DivIcon {
  const own = source === 'own'
  const size = own ? (selected ? 44 : 38) : selected ? 38 : 32
  const genreColor = GENRE_COLOR[genre ?? '연극']

  const body = own
    ? `background-image:linear-gradient(135deg,${BRAND_FROM} 0%,${BRAND_TO} 100%);border:2px solid rgba(255,255,255,.9);box-shadow:0 6px 18px rgba(255,196,46,.45)`
    : `background:#14141B;border:1.5px solid ${KOPIS_LINE};box-shadow:0 4px 12px rgba(0,0,0,.5)`

  const ring = selected
    ? `<span style="position:absolute;inset:-7px;border-radius:9999px;border:2px solid ${own ? BRAND_TO : '#8A8A96'};opacity:.85"></span>`
    : ''

  // 장르 색 점 — 색상만으로 정보를 전달하지 않도록 툴팁(title)도 함께 넣습니다
  const dot = `<span style="position:absolute;right:-1px;top:-1px;width:9px;height:9px;border-radius:9999px;background:${genreColor};border:1.5px solid #FFFFFF"></span>`

  const html = `
    <div title="${genre} · ${own ? '우리 무대' : '등록 공연'}" style="position:relative;width:${size}px;height:${size}px" class="${popped ? 'animate-pin-pop' : ''}">
      ${ring}
      <div style="position:absolute;inset:0;border-radius:9999px;display:flex;align-items:center;justify-content:center;${body}">
        ${glyphSvg(genre, Math.round(size * 0.52), own ? '#FFFFFF' : genreColor, own ? 1.7 : 1.5)}
      </div>
      ${dot}
      <span style="position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${own ? BRAND_TO : KOPIS_LINE}"></span>
    </div>`

  return L.divIcon({
    html,
    className: 'omd-marker',
    iconSize: [size, size + 7],
    iconAnchor: [size / 2, size + 7],
  })
}

/** 관객 현재 위치 */
export function userMarkerIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:22px;height:22px">
      <span style="position:absolute;inset:0;border-radius:9999px;background:${alpha('#4AA8FF', 0.28)}"></span>
      <span style="position:absolute;inset:5px;border-radius:9999px;background:#4AA8FF;border:2px solid #FFFFFF"></span>
    </div>`
  return L.divIcon({ html, className: 'omd-marker', iconSize: [22, 22], iconAnchor: [11, 11] })
}

/** 공간(공연자 화면 장소 탐색용) 마커 */
export function venueMarkerIcon(genre: Genre | null, selected: boolean, satisfied: boolean): L.DivIcon {
  const size = selected ? 38 : 32
  const color = satisfied ? '#4ED4A0' : '#7C8AA5'
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px">
      <div style="position:absolute;inset:0;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#14141B;border:1.5px solid ${color};box-shadow:0 4px 12px rgba(0,0,0,.5)">
        ${glyphSvg(genre, Math.round(size * 0.5), color, 1.5)}
      </div>
    </div>`
  return L.divIcon({ html, className: 'omd-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}
