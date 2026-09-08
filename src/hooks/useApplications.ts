import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 지원서 (§10).
 *
 * ★ 지원서는 낸 팀과 받은 호스트만 봅니다(RLS). 다른 팀의 지원 내용이 보이면
 *   경쟁 팀의 조건이 그대로 노출됩니다.
 *
 * 수락은 여기서 하지 않습니다 — 수락 한 번에 공연 생성·슬롯 잠금·다른 지원자 정리가
 * 한꺼번에 일어나야 해서, DB 함수 fn_accept_application 이 트랜잭션으로 처리합니다(§11).
 */

export interface Applicant {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string
  rejectReason: string | null
  createdAt: string
  artist: {
    id: string
    teamName: string
    genre: string
    memberCount: number
    durationMin: number
    bio: string
    photos: string[]
    clipUrls: string[]
    needs: string[]
  }
}

/** 아티스트가 보는 "내가 낸 지원" */
export interface MyApplication {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string
  rejectReason: string | null
  createdAt: string
  artistId: string
  post: {
    id: string
    message: string
    dateFrom: string
    dateTo: string
    offerFee: number
    venueName: string
  } | null
}

const EMPTY: never[] = []

type ArtistJoin = {
  id: string
  team_name: string
  genre: string
  member_count: number
  duration_min: number
  bio: string | null
  photos: string[] | null
  clip_urls: string[] | null
  needs: string[] | null
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/** 한 구인글의 지원자들 (호스트) */
export function useApplicants(postId: string | undefined): Query<Applicant[]> {
  const [data, setData] = useState<Applicant[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !postId) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('applications')
      .select(
        'id,status,message,reject_reason,created_at,artists!applications_artist_id_fkey(id,team_name,genre,member_count,duration_min,bio,photos,clip_urls,needs)',
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
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
              const a = one(r.artists as ArtistJoin | ArtistJoin[] | null)
              if (!a) return null
              return {
                id: r.id,
                status: r.status,
                message: r.message ?? '',
                rejectReason: r.reject_reason,
                createdAt: r.created_at,
                artist: {
                  id: a.id,
                  teamName: a.team_name,
                  genre: a.genre,
                  memberCount: a.member_count,
                  durationMin: a.duration_min,
                  bio: a.bio ?? '',
                  photos: a.photos ?? [],
                  clipUrls: a.clip_urls ?? [],
                  needs: a.needs ?? [],
                },
              } satisfies Applicant
            })
            .filter((x): x is Applicant => x !== null),
        )
      })
    return () => {
      alive = false
    }
  }, [postId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 내가 낸 지원 (아티스트) */
export function useMyApplications(artistIds: string[]): Query<MyApplication[]> {
  const [data, setData] = useState<MyApplication[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const key = artistIds.join(',')

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
      .from('applications')
      .select(
        'id,status,message,reject_reason,created_at,artist_id,posts!applications_post_id_fkey(id,message,date_from,date_to,offer_fee,venues!posts_venue_id_fkey(name))',
      )
      .in('artist_id', ids)
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
        type PostJoin = {
          id: string
          message: string | null
          date_from: string
          date_to: string
          offer_fee: number
          venues: { name: string } | { name: string }[] | null
        }
        setData(
          (rows ?? []).map((r) => {
            const p = one(r.posts as PostJoin | PostJoin[] | null)
            return {
              id: r.id,
              status: r.status,
              message: r.message ?? '',
              rejectReason: r.reject_reason,
              createdAt: r.created_at,
              artistId: r.artist_id,
              post: p
                ? {
                    id: p.id,
                    message: p.message ?? '',
                    dateFrom: p.date_from,
                    dateTo: p.date_to,
                    offerFee: p.offer_fee,
                    venueName: one(p.venues)?.name ?? '이름 없는 공간',
                  }
                : null,
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

/** 지원하기. 같은 글에 두 번 지원하면 DB 가 UNIQUE 로 막고, 23505 를 그대로 설명해 줍니다 */
export async function applyToPost(
  postId: string,
  artistId: string,
  message: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('applications')
    .insert({ post_id: postId, artist_id: artistId, message })
  if (!error) return null
  if (error.code === '23505') return '이미 이 구인글에 지원하셨습니다'
  return describeDbError(error)
}

/** 거절 — 사유는 지원한 팀에게 그대로 보입니다 */
export async function rejectApplication(
  applicationId: string,
  reason: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'rejected', reject_reason: reason })
    .eq('id', applicationId)
  return error ? describeDbError(error) : null
}

/** 지원 취소 — 아직 결정되지 않은 것만 */
export async function cancelApplication(applicationId: string): Promise<string | null> {
  const { error } = await supabase.from('applications').delete().eq('id', applicationId)
  return error ? describeDbError(error) : null
}
