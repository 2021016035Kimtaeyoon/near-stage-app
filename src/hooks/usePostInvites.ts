import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuth'
import type { Query } from './usePublicShows'

/**
 * 호스트가 아티스트를 초대 (§10).
 *
 * ★ applications 표에 직접 쓰지 않습니다. 그 표는 "아티스트가 낸 지원"이라는
 *   사실이고 RLS 도 그렇게 짜여 있습니다. 초대는 별개의 표(post_invites)에
 *   쌓이고, 아티스트가 실제로 지원 버튼을 눌러야 applications 에 행이 생깁니다.
 */
export interface MyInvite {
  id: string
  postId: string
  message: string
  createdAt: string
  post: {
    wantedGenres: string[]
    dateFrom: string
    dateTo: string
    offerFee: number
    venueName: string
  } | null
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/** 내 팀들에 온 초대. 이미 지원했으면 프론트에서 지웁니다(dismissInvite) */
export function useMyInvites(artistIds: string[]): Query<MyInvite[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<MyInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const key = artistIds.join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (!isSupabaseConfigured || !userId || ids.length === 0) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('post_invites')
      .select(
        'id,post_id,message,created_at,posts!post_invites_post_id_fkey(wanted_genres,date_from,date_to,offer_fee,venues!posts_venue_id_fkey(name))',
      )
      .in('artist_id', ids)
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        type PostJoin = {
          wanted_genres: string[]
          date_from: string
          date_to: string
          offer_fee: number
          venues: { name: string } | { name: string }[] | null
        }
        setData(
          (rows ?? []).map((r) => {
            const p = one(r.posts as PostJoin | PostJoin[] | null)
            const v = p ? one(p.venues) : null
            return {
              id: r.id,
              postId: r.post_id,
              message: r.message ?? '',
              createdAt: r.created_at,
              post: p
                ? {
                    wantedGenres: p.wanted_genres ?? [],
                    dateFrom: p.date_from,
                    dateTo: p.date_to,
                    offerFee: p.offer_fee,
                    venueName: v?.name ?? '이름 없는 공간',
                  }
                : null,
            }
          }),
        )
      })
    return () => {
      alive = false
    }
  }, [key, userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 구인글로 팀을 초대. 이미 초대했으면 DB 가 UNIQUE 로 막습니다 */
export async function sendInvite(
  postId: string,
  artistId: string,
  message: string,
): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const { error } = await supabase
    .from('post_invites')
    .insert({ post_id: postId, artist_id: artistId, invited_by: uid, message })
  if (!error) return null
  if (error.code === '23505') return '이미 이 팀을 초대했어요'
  return describeDbError(error)
}

/** 초대 지우기 — 아티스트가 지원했거나 관심 없어서 닫을 때, 호스트가 취소할 때 */
export async function dismissInvite(inviteId: string): Promise<string | null> {
  const { error } = await supabase.from('post_invites').delete().eq('id', inviteId)
  return error ? describeDbError(error) : null
}
