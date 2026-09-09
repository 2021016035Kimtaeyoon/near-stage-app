import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Genre } from '@/types'
import type { Query } from './usePublicShows'

/**
 * 공개된 팀 목록 — 호스트의 "아티스트 탐색"이 씁니다.
 *
 * ★ 마켓플레이스가 반쪽이었습니다. 아티스트는 공간을 탐색할 수 있는데
 *   (/performer/explore, usePublicVenues) 호스트는 구인글을 올리고 지원이
 *   오기만 기다릴 수밖에 없었습니다. 팀은 승인된 것만 누구나 읽을 수
 *   있습니다(artists_select_approved) — 같은 RLS 를 그대로 씁니다.
 */
export interface PublicArtist {
  id: string
  teamName: string
  genre: Genre | null
  memberCount: number
  durationMin: number
  bio: string
  needs: string[]
  photos: string[]
}

export function usePublicArtists(): Query<PublicArtist[]> {
  const [data, setData] = useState<PublicArtist[]>([])
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
    void supabase
      .from('artists')
      .select('id,team_name,genre,member_count,duration_min,bio,needs,photos')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(300)
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
            genre: (r.genre ?? null) as Genre | null,
            memberCount: r.member_count,
            durationMin: r.duration_min,
            bio: r.bio ?? '',
            needs: r.needs ?? [],
            photos: r.photos ?? [],
          })),
        )
      })
    return () => {
      alive = false
    }
  }, [tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}
