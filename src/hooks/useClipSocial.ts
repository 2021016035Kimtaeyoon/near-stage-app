import { useCallback, useEffect, useId, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 클립 좋아요 · 댓글.
 *
 * ★ 좋아요 행은 본인 것만 읽힙니다(RLS). "내가 눌렀는지"는 내 목록에서 보고,
 *   "몇 개인지"는 v_clip_feed 가 집계한 값을 씁니다.
 */

export interface ClipComment {
  id: string
  clipId: string
  body: string
  createdAt: string
  authorName: string
  authorAvatar: string | null
  isMine: boolean
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/* ───────────────── 좋아요 ───────────────── */

export function useMyClipLikes(): Query<string[]> & { toggle: (clipId: string) => Promise<void> } {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('clip_likes')
      .select('clip_id')
      .eq('user_id', userId)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData((rows ?? []).map((r) => r.clip_id))
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const toggle = useCallback(
    async (clipId: string) => {
      const uid = useAuthStore.getState().userId
      if (!uid) return
      const on = data.includes(clipId)
      // 하트는 즉시 반응해야 합니다. 실패하면 되돌립니다.
      setData((prev) => (on ? prev.filter((x) => x !== clipId) : [...prev, clipId]))
      const { error: err } = on
        ? await supabase.from('clip_likes').delete().eq('user_id', uid).eq('clip_id', clipId)
        : await supabase.from('clip_likes').insert({ user_id: uid, clip_id: clipId })
      if (err) {
        setData((prev) => (on ? [...prev, clipId] : prev.filter((x) => x !== clipId)))
        setError(describeDbError(err))
      }
    },
    [data],
  )

  return { data, loading, error, refresh, toggle }
}

/* ───────────────── 댓글 ───────────────── */

export function useClipComments(clipId: string | null): Query<ClipComment[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<ClipComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const channelId = useId()

  useEffect(() => {
    if (!isSupabaseConfigured || !clipId) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('clip_comments')
      .select(
        'id,clip_id,user_id,body,created_at,profiles!clip_comments_user_id_fkey(display_name,avatar_url)',
      )
      .eq('clip_id', clipId)
      .order('created_at', { ascending: false })
      .limit(200)
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
              clipId: r.clip_id,
              body: r.body,
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
  }, [clipId, userId, tick])

  // 채널 이름에 인스턴스 id 를 붙입니다 — 같은 이름이면 이미 subscribe 된 채널에
  // .on() 을 부르게 되어 앱이 죽습니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !clipId) return
    const ch = supabase
      .channel(`clip-comments-${clipId}-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clip_comments',
          filter: `clip_id=eq.${clipId}`,
        },
        () => setTick((n) => n + 1),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [clipId, channelId])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

export async function addComment(clipId: string, body: string): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const text = body.trim()
  if (!text) return null
  const { error } = await supabase
    .from('clip_comments')
    .insert({ clip_id: clipId, user_id: uid, body: text })
  return error ? describeDbError(error) : null
}

export async function deleteComment(commentId: string): Promise<string | null> {
  const { error } = await supabase.from('clip_comments').delete().eq('id', commentId)
  return error ? describeDbError(error) : null
}
