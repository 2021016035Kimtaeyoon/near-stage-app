import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 내가 가진 공간·팀.
 *
 * ★ 역할은 계정 속성이 아니라 보유 리소스로 판단합니다(§7).
 *   공간이 있으면 호스트, 팀이 있으면 아티스트, 아무것도 없으면 관객입니다.
 *   둘 다 가질 수 있고, 역할 선택 화면은 만들지 않습니다.
 */
export interface MyVenue {
  id: string
  name: string
  category: string
  address: string
  capacity: number
  status: 'pending' | 'approved' | 'rejected'
  rejectReason: string | null
  photos: string[]
  createdAt: string
}

export interface MyArtist {
  id: string
  teamName: string
  genre: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason: string | null
  photos: string[]
  createdAt: string
}

const EMPTY: never[] = []

export function useMyVenues(): Query<MyVenue[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<MyVenue[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('venues')
      .select('id,name,category,address,capacity,status,reject_reason,photos,created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData(
          (rows ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            address: r.address,
            capacity: r.capacity,
            status: r.status,
            rejectReason: r.reject_reason,
            photos: r.photos ?? [],
            createdAt: r.created_at,
          })),
        )
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

export function useMyArtists(): Query<MyArtist[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<MyArtist[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('artists')
      .select('id,team_name,genre,status,reject_reason,photos,created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData(
          (rows ?? []).map((r) => ({
            id: r.id,
            teamName: r.team_name,
            genre: r.genre,
            status: r.status,
            rejectReason: r.reject_reason,
            photos: r.photos ?? [],
            createdAt: r.created_at,
          })),
        )
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}
