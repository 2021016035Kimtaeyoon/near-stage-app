import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Genre } from '@/types'
import { useAuthStore } from './useAuth'
import type { Query } from './usePublicShows'

/**
 * 관심 조건 (§12).
 *
 * ★ 예전에는 브라우저 메모리에만 있었습니다. 새로고침하면 사라지고, '알림 받기'를
 *   켜도 대조하는 곳이 없어 알림이 영영 오지 않았습니다. 화면에는 알림을 준다고
 *   적혀 있었으니 가짜 기능이었습니다.
 *
 * ★ 조건은 장르만입니다. 거리는 서버가 대조할 수 없습니다 — 브라우저 좌표를
 *   서버로 보내지 않기 때문입니다. 예전 코드는 연남동 고정 좌표로 거리를 재고
 *   있었는데, 그건 사용자의 위치가 아니라 그냥 거짓말이었습니다.
 *
 * ★ 알림은 우리 무대가 새로 확정될 때만 옵니다(0024 트리거). 등록 공연은 하루에
 *   수십 건 들어와서 알림을 걸면 첫날 알림함이 터집니다.
 */

export interface SavedSearchRow {
  id: string
  name: string
  genres: Genre[]
  alertOn: boolean
}

/** 장르에서 자동으로 붙일 이름 */
export function autoName(genres: Genre[]): string {
  if (genres.length === 0) return '모든 장르'
  if (genres.length <= 2) return genres.join('·')
  return `${genres[0]} 외 ${genres.length - 1}`
}

/** 같은 조건인지 — 장르 집합이 같으면 같습니다 */
export function sameGenres(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const x = [...a].sort()
  const y = [...b].sort()
  return x.every((g, i) => g === y[i])
}

export interface SavedSearchApi extends Query<SavedSearchRow[]> {
  save: (genres: Genre[], name?: string) => Promise<string | null>
  remove: (id: string) => Promise<string | null>
  toggleAlert: (id: string, next: boolean) => Promise<string | null>
}

export function useSavedSearches(): SavedSearchApi {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<SavedSearchRow[]>([])
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
    void (async () => {
      const { data: rows, error: err } = await supabase
        .from('saved_searches')
        .select('id,name,genres,alert_on')
        .order('created_at', { ascending: false })
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
          genres: (r.genres ?? []) as Genre[],
          alertOn: r.alert_on,
        })),
      )
    })()
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const save = useCallback(
    async (genres: Genre[], name?: string) => {
      if (!userId) return '로그인이 필요합니다'
      const { error: err } = await supabase.from('saved_searches').insert({
        user_id: userId,
        name: (name ?? '').trim() || autoName(genres),
        genres,
      })
      if (err) {
        // 유니크 위반 = 이미 같은 조건이 있습니다. 오류로 보여줄 일이 아닙니다.
        if (err.code === '23505') return '이미 저장한 조건이에요'
        return describeDbError(err)
      }
      refresh()
      return null
    },
    [userId, refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await supabase.from('saved_searches').delete().eq('id', id)
      if (err) return describeDbError(err)
      refresh()
      return null
    },
    [refresh],
  )

  const toggleAlert = useCallback(
    async (id: string, next: boolean) => {
      // 화면을 먼저 바꿉니다 — 종을 눌렀는데 한 박자 늦게 바뀌면 안 눌린 줄 압니다
      setData((rows) => rows.map((r) => (r.id === id ? { ...r, alertOn: next } : r)))
      const { error: err } = await supabase
        .from('saved_searches')
        .update({ alert_on: next })
        .eq('id', id)
      if (err) {
        refresh()
        return describeDbError(err)
      }
      return null
    },
    [refresh],
  )

  return { data, loading, error, refresh, save, remove, toggleAlert }
}
