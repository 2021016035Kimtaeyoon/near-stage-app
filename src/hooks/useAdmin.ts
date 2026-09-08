import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 운영자 화면이 쓰는 데이터.
 *
 * RLS 가 이미 "운영자면 상태와 무관하게 전부 SELECT" 를 허용하므로(0003_rls.sql),
 * 여기서 권한을 다시 확인하지 않습니다. 운영자가 아니면 그냥 빈 목록이 옵니다 —
 * 프론트에서 막는 게 아니라 DB 가 막습니다.
 *
 * ★ profiles 조인은 반드시 FK 이름을 명시합니다(profiles!artists_owner_id_fkey).
 *   artists→profiles 경로가 owner_id 말고 follows 경유로도 존재해서, 그냥
 *   profiles(...) 라고 쓰면 PostgREST 가 모호하다며 PGRST201 로 거절합니다.
 */

export interface PendingVenue {
  id: string
  name: string
  category: string
  address: string
  capacity: number
  lat: number
  lng: number
  photos: string[]
  description: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  ownerName: string | null
}

export interface PendingArtist {
  id: string
  teamName: string
  genre: string
  memberCount: number
  durationMin: number
  bio: string
  photos: string[]
  clipUrls: string[]
  needs: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  ownerName: string | null
}

export interface AdminStats {
  venues: number
  venuesPending: number
  artists: number
  artistsPending: number
  shows: number
  ownShows: number
  attendances: number
}

/** 승인 대기 + 최근 등록 — 운영자가 훑어볼 목록 */
export function useAdminQueue(): Query<{ venues: PendingVenue[]; artists: PendingArtist[] }> {
  const isAdmin = useAuthStore((s) => s.profile?.isAdmin ?? false)
  const [data, setData] = useState<{ venues: PendingVenue[]; artists: PendingArtist[] }>({
    venues: [],
    artists: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void (async () => {
      const [v, a] = await Promise.all([
        supabase
          .from('venues')
          .select(
            'id,name,category,address,capacity,lat,lng,photos,description,status,created_at,profiles!venues_owner_id_fkey(display_name)',
          )
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('artists')
          .select(
            'id,team_name,genre,member_count,duration_min,bio,photos,clip_urls,needs,status,created_at,profiles!artists_owner_id_fkey(display_name)',
          )
          .order('created_at', { ascending: false })
          .limit(100),
      ])
      if (!alive) return
      setLoading(false)
      if (v.error || a.error) {
        setError(describeDbError(v.error ?? a.error))
        return
      }
      setError(null)
      type Owner = { display_name: string } | { display_name: string }[] | null
      const ownerName = (p: Owner): string | null =>
        Array.isArray(p) ? (p[0]?.display_name ?? null) : (p?.display_name ?? null)

      setData({
        venues: (v.data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          address: r.address,
          capacity: r.capacity,
          lat: r.lat,
          lng: r.lng,
          photos: r.photos ?? [],
          description: r.description ?? '',
          status: r.status,
          createdAt: r.created_at,
          ownerName: ownerName(r.profiles as Owner),
        })),
        artists: (a.data ?? []).map((r) => ({
          id: r.id,
          teamName: r.team_name,
          genre: r.genre,
          memberCount: r.member_count,
          durationMin: r.duration_min,
          bio: r.bio ?? '',
          photos: r.photos ?? [],
          clipUrls: r.clip_urls ?? [],
          needs: r.needs ?? [],
          status: r.status,
          createdAt: r.created_at,
          ownerName: ownerName(r.profiles as Owner),
        })),
      })
    })()
    return () => {
      alive = false
    }
  }, [isAdmin, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 지표 — 전부 실제 집계입니다 (§13) */
export function useAdminStats(): Query<AdminStats | null> {
  const isAdmin = useAuthStore((s) => s.profile?.isAdmin ?? false)
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void (async () => {
      /** count 만 받아옵니다 — 행을 다 끌어오지 않습니다 */
      const count = async (table: string, filter?: [string, string]) => {
        let q = supabase.from(table).select('id', { count: 'exact', head: true })
        if (filter) q = q.eq(filter[0], filter[1])
        const { count: c, error: e } = await q
        if (e) throw new Error(describeDbError(e))
        return c ?? 0
      }
      try {
        const [venues, venuesPending, artists, artistsPending, shows, ownShows, attendances] =
          await Promise.all([
            count('venues'),
            count('venues', ['status', 'pending']),
            count('artists'),
            count('artists', ['status', 'pending']),
            count('shows'),
            count('shows', ['source', 'own']),
            count('attendances'),
          ])
        if (!alive) return
        setLoading(false)
        setError(null)
        setData({ venues, venuesPending, artists, artistsPending, shows, ownShows, attendances })
      } catch (e) {
        if (!alive) return
        setLoading(false)
        setError(e instanceof Error ? e.message : '지표를 불러오지 못했어요')
      }
    })()
    return () => {
      alive = false
    }
  }, [isAdmin, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 승인 · 반려 — 상태 변경은 RLS·트리거가 운영자만 허용합니다 */
export async function setApproval(
  table: 'venues' | 'artists',
  id: string,
  status: 'approved' | 'rejected',
  rejectReason?: string,
): Promise<string | null> {
  const { error } = await supabase
    .from(table)
    .update({ status, reject_reason: status === 'rejected' ? (rejectReason ?? '') : null })
    .eq('id', id)
  return error ? describeDbError(error) : null
}

/* ───────────────── 신고 큐 (§16) ───────────────── */

export interface AdminReport {
  id: string
  targetType: 'venue' | 'artist' | 'clip' | 'comment' | 'show'
  targetId: string
  reason: string
  detail: string
  status: 'open' | 'resolved' | 'rejected'
  createdAt: string
  reporterName: string | null
}

/**
 * 처리 대기 신고.
 *
 * ★ 신고자 이름은 운영자에게만 보입니다(RLS). 신고당한 쪽에는 어떤 화면에서도
 *   노출되지 않습니다 — 보복이 걱정되면 아무도 신고하지 않습니다.
 */
export function useAdminReports(): Query<AdminReport[]> {
  const isAdmin = useAuthStore((s) => s.profile?.isAdmin ?? false)
  const [data, setData] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('reports')
      .select(
        'id,target_type,target_id,reason,detail,status,created_at,profiles!reports_reporter_id_fkey(display_name)',
      )
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
        type P = { display_name: string }
        setData(
          (rows ?? []).map((r) => {
            const p = r.profiles as P | P[] | null
            return {
              id: r.id,
              targetType: r.target_type,
              targetId: r.target_id,
              reason: r.reason,
              detail: r.detail ?? '',
              status: r.status,
              createdAt: r.created_at,
              reporterName: Array.isArray(p)
                ? (p[0]?.display_name ?? null)
                : (p?.display_name ?? null),
            }
          }),
        )
      })
    return () => {
      alive = false
    }
  }, [isAdmin, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

export async function setReportStatus(
  reportId: string,
  status: 'resolved' | 'rejected',
  adminNote: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('reports')
    .update({ status, admin_note: adminNote })
    .eq('id', reportId)
  return error ? describeDbError(error) : null
}
