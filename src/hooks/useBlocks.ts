import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuth'
import type { Query } from './usePublicShows'

export interface BlockedUser {
  id: string
  name: string
}

/**
 * 내 차단 목록 (§16).
 *
 * ★ 신고와 다릅니다. 신고는 운영자가 판단해서 조치하는 것이고, 차단은 내
 *   화면에서 그 사람 글을 즉시 안 보이게 하는 것입니다. 판단을 기다릴 필요가
 *   없습니다 — 누르는 순간 반영됩니다.
 */
export function useMyBlocks(): Query<BlockedUser[]> & {
  block: (userId: string, name?: string) => Promise<string | null>
  unblock: (userId: string) => Promise<string | null>
  isBlocked: (userId: string) => boolean
} {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<BlockedUser[]>([])
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
      .from('blocks')
      .select('blocked_id,profiles!blocks_blocked_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        type P = { display_name: string } | { display_name: string }[] | null
        setData(
          (rows ?? []).map((r) => {
            const p = r.profiles as P
            const name = Array.isArray(p) ? p[0]?.display_name : p?.display_name
            return { id: r.blocked_id, name: name || '이름 없는 사용자' }
          }),
        )
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const block = useCallback(
    async (target: string, name?: string) => {
      const uid = useAuthStore.getState().userId
      if (!uid) return '로그인이 필요합니다'
      // 즉시 반영 — 판단을 기다릴 필요가 없는 것이 신고와 다른 점입니다
      setData((prev) => [{ id: target, name: name ?? '이름 없는 사용자' }, ...prev])
      const { error: err } = await supabase
        .from('blocks')
        .insert({ blocker_id: uid, blocked_id: target })
      if (err && err.code !== '23505') {
        setData((prev) => prev.filter((b) => b.id !== target))
        return describeDbError(err)
      }
      return null
    },
    [],
  )

  const unblock = useCallback(async (target: string) => {
    const uid = useAuthStore.getState().userId
    if (!uid) return '로그인이 필요합니다'
    setData((prev) => prev.filter((b) => b.id !== target))
    const { error: err } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', uid)
      .eq('blocked_id', target)
    return err ? describeDbError(err) : null
  }, [])

  const isBlocked = useCallback((target: string) => data.some((b) => b.id === target), [data])

  return { data, loading, error, refresh, block, unblock, isBlocked }
}
