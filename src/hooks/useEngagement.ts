import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 참석 예정 · 좋아요 · 팔로우 (§12).
 *
 * ★ 좋아요와 팔로우는 본인 행만 읽을 수 있습니다(RLS). 누가 무엇을 좋아하는지
 *   남이 알 수 없어야 합니다. 화면에 필요한 "이 공연 좋아요 N개"는 개별 행이
 *   아니라 v_public_shows 가 집계해서 내려줍니다.
 *
 * ★ 참석 예정은 우리 무대(source='own')에만 있습니다. 등록 공연(KOPIS)은 좌석이
 *   원본 예매처에 있어서, 여기서 참석을 받으면 실제 좌석과 어긋나 관객이 헛걸음합니다.
 *   DB 정책도 같은 조건으로 막혀 있습니다.
 */

export interface MyAttendance {
  /** 체크인 QR에 담기는 값(nearstage:ticket:<id>) */
  id: string
  showId: string
  headcount: number
  status: 'going' | 'attended' | 'canceled'
}

const EMPTY_IDS: string[] = []

/* ───────────────── 좋아요 ───────────────── */

export function useMyLikes(): Query<string[]> & { toggle: (showId: string) => Promise<void> } {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<string[]>(EMPTY_IDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setData(EMPTY_IDS)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('likes')
      .select('show_id')
      .eq('user_id', userId)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData((rows ?? []).map((r) => r.show_id))
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const toggle = useCallback(
    async (showId: string) => {
      const uid = useAuthStore.getState().userId
      if (!uid) return
      const on = data.includes(showId)
      // 낙관적 반영 — 하트는 즉시 반응해야 합니다. 실패하면 되돌립니다.
      setData((prev) => (on ? prev.filter((x) => x !== showId) : [...prev, showId]))
      const { error: err } = on
        ? await supabase.from('likes').delete().eq('user_id', uid).eq('show_id', showId)
        : await supabase.from('likes').insert({ user_id: uid, show_id: showId })
      if (err) {
        setData((prev) => (on ? [...prev, showId] : prev.filter((x) => x !== showId)))
        setError(describeDbError(err))
      }
    },
    [data],
  )

  return { data, loading, error, refresh, toggle }
}

/* ───────────────── 팔로우 ───────────────── */

export function useMyFollows(): Query<string[]> & { toggle: (artistId: string) => Promise<void> } {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<string[]>(EMPTY_IDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setData(EMPTY_IDS)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('follows')
      .select('artist_id')
      .eq('user_id', userId)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData((rows ?? []).map((r) => r.artist_id))
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const toggle = useCallback(
    async (artistId: string) => {
      const uid = useAuthStore.getState().userId
      if (!uid) return
      const on = data.includes(artistId)
      setData((prev) => (on ? prev.filter((x) => x !== artistId) : [...prev, artistId]))
      const { error: err } = on
        ? await supabase.from('follows').delete().eq('user_id', uid).eq('artist_id', artistId)
        : await supabase.from('follows').insert({ user_id: uid, artist_id: artistId })
      if (err) {
        setData((prev) => (on ? [...prev, artistId] : prev.filter((x) => x !== artistId)))
        setError(describeDbError(err))
      }
    },
    [data],
  )

  return { data, loading, error, refresh, toggle }
}

/* ───────────────── 참석 예정 ───────────────── */

/** 내 참석 예정 전체. 마이 페이지와 상세 화면이 같이 씁니다 */
export function useMyAttendances(): Query<MyAttendance[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<MyAttendance[]>([])
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
      .from('attendances')
      .select('id,show_id,headcount,status')
      .eq('user_id', userId)
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
            showId: r.show_id,
            headcount: r.headcount,
            status: r.status,
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

/**
 * 참석 예정 등록·변경.
 *
 * UNIQUE(show_id, user_id) 라서 두 번 누르면 23505 가 납니다. 취소했다가 다시
 * 오는 사람이 흔하므로 upsert 로 되살립니다 — "이미 신청했습니다"라고 막으면
 * 취소한 뒤에는 영영 못 옵니다.
 */
export async function setAttendance(
  showId: string,
  headcount: number,
): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const { error } = await supabase
    .from('attendances')
    .upsert(
      { show_id: showId, user_id: uid, headcount, status: 'going' },
      { onConflict: 'show_id,user_id' },
    )
  return error ? describeDbError(error) : null
}

export async function cancelAttendance(showId: string): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const { error } = await supabase
    .from('attendances')
    .update({ status: 'canceled' })
    .eq('show_id', showId)
    .eq('user_id', uid)
  return error ? describeDbError(error) : null
}
