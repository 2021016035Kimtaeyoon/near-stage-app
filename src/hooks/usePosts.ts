import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { VenueEquipment } from '@/lib/needMatch'
import type { Query } from './usePublicShows'

/**
 * 구인글 (§10).
 *
 * 호스트가 "이런 팀을 찾습니다"를 올리면, 아티스트가 지원합니다. 구인글 자체는
 * 누구나 볼 수 있고(posts_select_all), 지원서는 낸 팀과 받은 호스트만 봅니다.
 *
 * ★ offer_fee 는 참고용 금액입니다. 플랫폼은 대금에 관여하지 않습니다 —
 *   개런티는 호스트와 아티스트가 직접 정하고 현장에서 정산합니다.
 */

export interface MyPost {
  id: string
  venueId: string
  wantedGenres: string[]
  dateFrom: string
  dateTo: string
  offerFee: number
  message: string
  status: 'open' | 'closed'
  createdAt: string
  /** 내 구인글일 때만 채워집니다. 남의 글은 지원 수를 볼 수 없습니다(RLS) */
  applicationCount: number
  pendingCount: number
}

/** 아티스트가 보는 구인글 — 공간 정보가 붙습니다 */
export interface OpenPost {
  id: string
  wantedGenres: string[]
  dateFrom: string
  dateTo: string
  offerFee: number
  message: string
  createdAt: string
  venue: {
    id: string
    name: string
    category: string
    address: string
    capacity: number
    photos: string[]
    equipment: VenueEquipment
  }
}

const EMPTY: never[] = []

type VenueJoin = {
  id: string
  name: string
  category: string
  address: string
  capacity: number
  photos: string[] | null
  equipment: VenueEquipment | null
}

/** 조인 결과가 객체로 올 때도 배열로 올 때도 있어서 한 군데서 풉니다 */
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/** 내가 낸 구인글 (호스트) */
export function useMyPosts(venueIds: string[]): Query<MyPost[]> {
  const [data, setData] = useState<MyPost[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const key = venueIds.join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (!isSupabaseConfigured || ids.length === 0) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('posts')
      .select(
        'id,venue_id,wanted_genres,date_from,date_to,offer_fee,message,status,created_at,applications(id,status)',
      )
      .in('venue_id', ids)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData(
          (rows ?? []).map((r) => {
            const apps = (r.applications ?? []) as { id: string; status: string }[]
            return {
              id: r.id,
              venueId: r.venue_id,
              wantedGenres: r.wanted_genres ?? [],
              dateFrom: r.date_from,
              dateTo: r.date_to,
              offerFee: r.offer_fee,
              message: r.message ?? '',
              status: r.status,
              createdAt: r.created_at,
              applicationCount: apps.length,
              pendingCount: apps.filter((a) => a.status === 'pending').length,
            }
          }),
        )
      })
    return () => {
      alive = false
    }
  }, [key, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 지원할 수 있는 구인글 (아티스트) — 마감되지 않았고 기간이 지나지 않은 것만 */
export function useOpenPosts(): Query<OpenPost[]> {
  const [data, setData] = useState<OpenPost[]>(EMPTY)
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
    const today = new Date().toISOString().slice(0, 10)
    void supabase
      .from('posts')
      .select(
        'id,wanted_genres,date_from,date_to,offer_fee,message,created_at,venues!posts_venue_id_fkey(id,name,category,address,capacity,photos,equipment)',
      )
      .eq('status', 'open')
      .gte('date_to', today)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData(
          (rows ?? [])
            .map((r) => {
              const v = one(r.venues as VenueJoin | VenueJoin[] | null)
              // 공간이 승인 전이면 RLS 가 조인을 비워서 보냅니다 — 그런 글은 숨깁니다
              if (!v) return null
              return {
                id: r.id,
                wantedGenres: r.wanted_genres ?? [],
                dateFrom: r.date_from,
                dateTo: r.date_to,
                offerFee: r.offer_fee,
                message: r.message ?? '',
                createdAt: r.created_at,
                venue: {
                  id: v.id,
                  name: v.name,
                  category: v.category,
                  address: v.address,
                  capacity: v.capacity,
                  photos: v.photos ?? [],
                  equipment: v.equipment ?? {},
                },
              } satisfies OpenPost
            })
            .filter((p): p is OpenPost => p !== null),
        )
      })
    return () => {
      alive = false
    }
  }, [tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

export async function createPost(input: {
  venueId: string
  wantedGenres: string[]
  dateFrom: string
  dateTo: string
  offerFee: number
  message: string
}): Promise<string | null> {
  const { error } = await supabase.from('posts').insert({
    venue_id: input.venueId,
    wanted_genres: input.wantedGenres,
    date_from: input.dateFrom,
    date_to: input.dateTo,
    offer_fee: input.offerFee,
    message: input.message,
  })
  return error ? describeDbError(error) : null
}

export async function setPostStatus(
  postId: string,
  status: 'open' | 'closed',
): Promise<string | null> {
  const { error } = await supabase.from('posts').update({ status }).eq('id', postId)
  return error ? describeDbError(error) : null
}
