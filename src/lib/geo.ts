/** 거리 계산 — 외부 API 없이 하버사인 공식으로 직접 계산 */

export interface LatLng {
  lat: number
  lng: number
}

const R = 6371 // km

export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

/** 도보 속도 4km/h 기준 소요 시간 */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km / 4) * 60))
}

export function walkLabel(km: number): string {
  const m = walkMinutes(km)
  if (m <= 30) return `도보 ${m}분`
  return `약 ${(m / 60).toFixed(1)}시간`
}
