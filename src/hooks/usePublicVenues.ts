import { useCallback, useEffect, useState } from 'react'
import type { VenueEquipment } from '@/lib/needMatch'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 공개된 공간 목록 — 아티스트의 "장소 탐색"이 씁니다.
 *
 * ★ 이 화면은 목 스토어(venues: [])를 읽고 있어서 아티스트 메인 탭이 영구히 빈
 *   화면이었습니다. venues 는 승인된 것만 누구나 읽을 수 있습니다(RLS).
 *
 * 슬롯이 하나도 열려 있지 않은 공간도 보여줍니다 — 지금 당장 지원은 못 하지만
 * "이런 곳이 있다"를 알고 나중에 다시 볼 수 있어야 합니다. 대신 카드에 열린
 * 시간 수를 함께 보여줘서 헛걸음을 줄입니다.
 */
export interface PublicVenue {
  id: string
  name: string
  category: string
  address: string
  lat: number
  lng: number
  capacity: number
  rentalFee: number
  equipment: VenueEquipment
  preferredGenres: string[]
  description: string
  photos: string[]
  /** 앞으로 열려 있는 슬롯 수 */
  openSlots: number
}

export function usePublicVenues(): Query<PublicVenue[]> {
  const [data, setData] = useState<PublicVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void (async () => {
      const nowIso = new Date().toISOString()
      const [v, s] = await Promise.all([
        supabase
          .from('venues')
          .select(
            'id,name,category,address,lat,lng,capacity,rental_fee,equipment,preferred_genres,description,photos',
          )
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(300),
        // 슬롯은 누구나 읽을 수 있습니다(venue_slots_select_all). 공간마다 몇 개가
        // 열려 있는지 세어 카드에 보여줍니다.
        supabase
          .from('venue_slots')
          .select('venue_id,is_open,locked_by_show_id')
          .gte('starts_at', nowIso)
          .limit(2000),
      ])
      if (!alive) return
      setLoading(false)
      if (v.error) {
        setError(describeDbError(v.error))
        return
      }
      setError(null)

      const open = new Map<string, number>()
      for (const r of s.data ?? []) {
        if (!r.is_open || r.locked_by_show_id) continue
        open.set(r.venue_id, (open.get(r.venue_id) ?? 0) + 1)
      }

      setData(
        (v.data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          address: r.address,
          lat: r.lat,
          lng: r.lng,
          capacity: r.capacity,
          rentalFee: r.rental_fee,
          equipment: (r.equipment ?? {}) as VenueEquipment,
          preferredGenres: r.preferred_genres ?? [],
          description: r.description ?? '',
          photos: r.photos ?? [],
          openSlots: open.get(r.id) ?? 0,
        })),
      )
    })()
    return () => {
      alive = false
    }
  }, [tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 공간 하나 — 상세 화면용 */
export function usePublicVenue(venueId: string | undefined): Query<PublicVenue | null> {
  const all = usePublicVenues()
  const data = all.data.find((v) => v.id === venueId) ?? null
  return { data, loading: all.loading, error: all.error, refresh: all.refresh }
}
