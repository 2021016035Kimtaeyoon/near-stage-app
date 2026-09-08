import { useCallback, useEffect, useId, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 인앱 알림 (§12).
 *
 * ★ 발송은 서버만 합니다. notifications 에 INSERT 정책이 없어서 프론트에서는
 *   알림을 만들 수 없습니다 — fn_accept_application 같은 security definer 함수와
 *   Edge Function 만 넣습니다. 그래야 남에게 가짜 알림을 보낼 수 없습니다.
 *
 * ★ 새 알림은 Realtime 으로 바로 받습니다(0012). 앱을 다시 열어야 보이면
 *   "공연 확정" 같은 소식이 제때 안 닿습니다.
 */

export interface AppNotice {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export function useNotifications(): Query<AppNotice[]> & { unread: number } {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<AppNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const channelId = useId()

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('notifications')
      .select('id,type,title,body,link,read_at,created_at')
      .eq('user_id', userId)
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
        setData(
          (rows ?? []).map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            body: r.body ?? '',
            link: r.link,
            readAt: r.read_at,
            createdAt: r.created_at,
          })),
        )
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  // 새 알림이 오면 바로 다시 읽습니다. payload 를 그대로 붙이지 않는 이유는
  // 목록 정렬·중복 처리를 한 군데(위 쿼리)에서만 하기 위해서입니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return
    const ch = supabase
      .channel(`notif-${userId}-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => setTick((n) => n + 1),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [userId, channelId])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  const unread = data.filter((n) => !n.readAt).length
  return { data, loading, error, refresh, unread }
}

export async function markRead(ids: string[]): Promise<string | null> {
  if (ids.length === 0) return null
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
  return error ? describeDbError(error) : null
}
