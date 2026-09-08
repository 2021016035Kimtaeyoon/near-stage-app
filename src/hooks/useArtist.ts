import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 아티스트 한 팀의 전체 정보 (§12).
 *
 * ★ 공연 목록(v_public_shows)에는 팀 이름·장르·사진만 실려 옵니다. 목록 100건에
 *   소개글과 셋리스트까지 실으면 지도를 여는 데만 몇 초가 걸립니다. 그래서 상세
 *   화면에서 필요한 팀 하나만 따로 읽습니다.
 *
 * 팔로워 수와 과거 공연 수는 세어서 옵니다. 하드코딩하거나 지어내지 않습니다 —
 * 0이면 0으로 보여주는 게 맞습니다.
 */

export interface ArtistDetail {
  id: string
  teamName: string
  genre: string
  memberCount: number
  durationMin: number
  bio: string
  setlist: string[]
  needs: string[]
  photos: string[]
  clipUrls: string[]
  followerCount: number
  pastShowCount: number
}

export function useArtist(artistId: string | null | undefined): Query<ArtistDetail | null> {
  const [data, setData] = useState<ArtistDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !artistId) {
      setData(null)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void (async () => {
      const nowIso = new Date().toISOString()
      const [a, f, p] = await Promise.all([
        supabase
          .from('artists')
          .select(
            'id,team_name,genre,member_count,duration_min,bio,setlist,needs,photos,clip_urls',
          )
          .eq('id', artistId)
          .maybeSingle(),
        // ★ follows 는 본인 행만 읽힙니다(RLS). 남의 팔로우는 못 세므로 여기서 나온
        //   숫자는 "내가 팔로우했는지"에 가깝습니다. 집계가 필요해지면 뷰로 옮겨야
        //   합니다 — 지금 화면에는 팔로워 수를 쓰지 않습니다.
        supabase
          .from('follows')
          .select('artist_id', { count: 'exact', head: true })
          .eq('artist_id', artistId),
        supabase
          .from('shows')
          .select('id', { count: 'exact', head: true })
          .eq('artist_id', artistId)
          .lt('starts_at', nowIso),
      ])
      if (!alive) return
      setLoading(false)
      if (a.error) {
        setError(describeDbError(a.error))
        return
      }
      setError(null)
      if (!a.data) {
        setData(null)
        return
      }
      setData({
        id: a.data.id,
        teamName: a.data.team_name,
        genre: a.data.genre,
        memberCount: a.data.member_count,
        durationMin: a.data.duration_min,
        bio: a.data.bio ?? '',
        setlist: a.data.setlist ?? [],
        needs: a.data.needs ?? [],
        photos: a.data.photos ?? [],
        clipUrls: a.data.clip_urls ?? [],
        followerCount: f.count ?? 0,
        pastShowCount: p.count ?? 0,
      })
    })()
    return () => {
      alive = false
    }
  }, [artistId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}
