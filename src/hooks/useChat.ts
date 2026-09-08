import { useCallback, useEffect, useId, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 채팅 (§13).
 *
 * 대화방은 공간 ↔ 팀 한 쌍당 하나입니다(UNIQUE(venue_id, artist_id)). 수락하는
 * 순간 fn_accept_application 이 만들어 줍니다 — 확정되고 나서 "그런데 몇 시에
 * 오면 되나요"를 물을 곳이 없으면 결국 전화번호를 주고받게 되고, 그러면 우리가
 * 굳이 전화번호를 안 받는 의미가 없어집니다.
 *
 * ★ 대화방과 메시지는 양쪽 당사자만 읽고 씁니다(RLS). 관객은 아예 접근할 수
 *   없습니다. 여기 오가는 건 개런티 협의 같은 내용이라 새면 안 됩니다.
 *
 * ★ select 문자열은 리터럴로 둡니다. 상수로 빼면 supabase-js 가 결과 타입을
 *   추론하지 못해 조인 필드가 전부 컴파일 에러로 잡힙니다.
 */

export interface ChatThread {
  id: string
  venueId: string
  artistId: string
  showId: string | null
  venueName: string
  artistName: string
  artistPhotos: string[]
  venuePhotos: string[]
  createdAt: string
}

export interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  body: string
  readAt: string | null
  createdAt: string
  isMine: boolean
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

type VenueJoin = { id: string; name: string; photos: string[] | null }
type ArtistJoin = { id: string; team_name: string; photos: string[] | null }

/**
 * 내 대화방 목록.
 *
 * 필터를 걸지 않습니다 — RLS 가 이미 "내가 주인인 공간이나 팀의 방"만 통과시키므로,
 * 프론트에서 한 번 더 거르면 조건이 어긋날 때 오히려 방이 사라집니다.
 */
export function useChatThreads(): Query<ChatThread[]> {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<ChatThread[]>([])
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
      .from('threads')
      .select(
        'id,venue_id,artist_id,show_id,created_at,venues!threads_venue_id_fkey(id,name,photos),artists!threads_artist_id_fkey(id,team_name,photos)',
      )
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData(
          (rows ?? []).map((r) => {
            const v = one(r.venues as VenueJoin | VenueJoin[] | null)
            const a = one(r.artists as ArtistJoin | ArtistJoin[] | null)
            return {
              id: r.id,
              venueId: r.venue_id,
              artistId: r.artist_id,
              showId: r.show_id,
              venueName: v?.name ?? '이름 없는 공간',
              artistName: a?.team_name ?? '이름 없는 팀',
              venuePhotos: v?.photos ?? [],
              artistPhotos: a?.photos ?? [],
              createdAt: r.created_at,
            }
          }),
        )
      })
    return () => {
      alive = false
    }
  }, [userId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 대화방 하나 + 메시지. 새 메시지는 Realtime 으로 바로 붙습니다 */
export function useChatThread(threadId: string | undefined): {
  thread: ChatThread | null
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  refresh: () => void
} {
  const userId = useAuthStore((s) => s.userId)
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const channelId = useId()

  useEffect(() => {
    if (!isSupabaseConfigured || !threadId || !userId) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void (async () => {
      const [t, m] = await Promise.all([
        supabase
          .from('threads')
          .select(
            'id,venue_id,artist_id,show_id,created_at,venues!threads_venue_id_fkey(id,name,photos),artists!threads_artist_id_fkey(id,team_name,photos)',
          )
          .eq('id', threadId)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('id,thread_id,sender_id,body,read_at,created_at')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true })
          .limit(500),
      ])
      if (!alive) return
      setLoading(false)
      if (t.error || m.error) {
        setError(describeDbError(t.error ?? m.error))
        return
      }
      setError(null)
      if (t.data) {
        const v = one(t.data.venues as VenueJoin | VenueJoin[] | null)
        const a = one(t.data.artists as ArtistJoin | ArtistJoin[] | null)
        setThread({
          id: t.data.id,
          venueId: t.data.venue_id,
          artistId: t.data.artist_id,
          showId: t.data.show_id,
          venueName: v?.name ?? '이름 없는 공간',
          artistName: a?.team_name ?? '이름 없는 팀',
          venuePhotos: v?.photos ?? [],
          artistPhotos: a?.photos ?? [],
          createdAt: t.data.created_at,
        })
      } else {
        setThread(null)
      }
      setMessages(
        (m.data ?? []).map((r) => ({
          id: r.id,
          threadId: r.thread_id,
          senderId: r.sender_id,
          body: r.body,
          readAt: r.read_at,
          createdAt: r.created_at,
          isMine: r.sender_id === userId,
        })),
      )
    })()
    return () => {
      alive = false
    }
  }, [threadId, userId, tick])

  // ★ 상대가 보낸 메시지를 바로 받습니다. 채팅에서 새로고침을 시키면 채팅이 아닙니다.
  //   내가 보낸 것은 전송 직후 화면에 이미 붙였으므로 중복을 걸러냅니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !threadId || !userId) return
    const ch = supabase
      .channel(`thread-${threadId}-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const r = payload.new as {
            id: string
            thread_id: string
            sender_id: string
            body: string
            read_at: string | null
            created_at: string
          }
          setMessages((prev) =>
            prev.some((x) => x.id === r.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: r.id,
                    threadId: r.thread_id,
                    senderId: r.sender_id,
                    body: r.body,
                    readAt: r.read_at,
                    createdAt: r.created_at,
                    isMine: r.sender_id === userId,
                  },
                ],
          )
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [threadId, userId, channelId])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { thread, messages, loading, error, refresh }
}

export async function sendMessage(threadId: string, body: string): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const text = body.trim()
  if (!text) return null
  const { error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: uid, body: text })
  return error ? describeDbError(error) : null
}

/** 상대가 보낸 안 읽은 메시지를 읽음 처리 */
export async function markThreadRead(threadId: string): Promise<void> {
  const uid = useAuthStore.getState().userId
  if (!uid) return
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', uid)
    .is('read_at', null)
}
