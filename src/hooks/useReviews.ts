import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 리뷰 (§12).
 *
 * ★ 공연이 실제로 끝났고, 참석한 사람만 쓸 수 있습니다. 프론트에서 버튼을 숨기는
 *   것과 별개로 DB 정책이 같은 조건을 겁니다(0012). 안 가본 공연에 별점을 남길 수
 *   없어야 평점이 의미를 가집니다.
 *
 * 리뷰 본문은 누구나 읽습니다 — 읽을 수 있어야 다음 관객이 판단할 수 있습니다.
 */

export type ReviewTarget = 'venue' | 'artist'

export interface ShowReview {
  id: string
  targetType: ReviewTarget
  rating: number
  body: string
  createdAt: string
  authorName: string
  authorAvatar: string | null
  isMine: boolean
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export function useShowReviews(showId: string | undefined): Query<ShowReview[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<ShowReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !showId) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('reviews')
      .select(
        'id,user_id,target_type,rating,body,created_at,profiles!reviews_user_id_fkey(display_name,avatar_url)',
      )
      .eq('show_id', showId)
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        type P = { display_name: string | null; avatar_url: string | null }
        setData(
          (rows ?? []).map((r) => {
            const p = one(r.profiles as P | P[] | null)
            return {
              id: r.id,
              targetType: r.target_type,
              rating: r.rating,
              body: r.body ?? '',
              createdAt: r.created_at,
              authorName: p?.display_name ?? '이름 없는 사용자',
              authorAvatar: p?.avatar_url ?? null,
              isMine: r.user_id === userId,
            }
          }),
        )
      })
    return () => {
      alive = false
    }
  }, [showId, userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/**
 * 리뷰 작성. 공간과 팀에 각각 한 번씩 쓸 수 있습니다.
 *
 * 이미 쓴 리뷰는 UNIQUE(show_id, user_id, target_type) 에 걸리므로 덮어씁니다 —
 * "이미 쓰셨습니다"로 막으면 오타 하나 고칠 방법이 없습니다.
 */
export async function submitReview(input: {
  showId: string
  targetType: ReviewTarget
  rating: number
  body: string
}): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const { error } = await supabase.from('reviews').upsert(
    {
      show_id: input.showId,
      user_id: uid,
      target_type: input.targetType,
      rating: input.rating,
      body: input.body,
    },
    { onConflict: 'show_id,user_id,target_type' },
  )
  if (!error) return null
  // 정책에 걸리면 42501 이 옵니다. 이유를 사람 말로 바꿔줍니다.
  if (error.code === '42501') {
    return '공연이 끝난 뒤, 참석하신 분만 리뷰를 쓸 수 있어요'
  }
  return describeDbError(error)
}
