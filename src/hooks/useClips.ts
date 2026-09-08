import { useCallback, useEffect, useId, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 클립 (쇼츠).
 *
 * 관객의 "클립" 탭과 공연 상세가 같은 표를 읽습니다. 팀이 올린 영상은 업로드본이면
 * 그 자리에서 재생되고, 외부 링크면 썸네일 카드로 보여주고 원본으로 보냅니다.
 *
 * ★ 심사 중인 팀의 클립은 남에게 보이지 않습니다(RLS). 승인 전 팀이 아무거나
 *   올려서 피드에 뿌리는 걸 막습니다.
 */

export type ClipKind = 'upload' | 'link'

export interface Clip {
  id: string
  artistId: string
  kind: ClipKind
  url: string
  thumbUrl: string | null
  title: string
  durationSec: number | null
  createdAt: string
  artistName: string
  artistGenre: string
  artistPhotos: string[]
  likeCount: number
  commentCount: number
}

type ArtistJoin = { team_name: string; genre: string; photos: string[] | null }

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

type Row = {
  id: string
  artist_id: string
  kind: ClipKind
  url: string
  thumb_url: string | null
  title: string | null
  duration_sec: number | null
  created_at: string
  artists?: ArtistJoin | ArtistJoin[] | null
  artist_name?: string | null
  artist_genre?: string | null
  artist_photos?: string[] | null
  like_count?: number
  comment_count?: number
}

function toClip(r: Row): Clip {
  // 피드는 v_clip_feed(집계 포함), 팀 상세는 artist_clips + 조인으로 옵니다.
  // 두 모양을 한 군데서 풉니다.
  const a = one(r.artists ?? null)
  return {
    id: r.id,
    artistId: r.artist_id,
    kind: r.kind,
    url: r.url,
    thumbUrl: r.thumb_url,
    title: r.title ?? '',
    durationSec: r.duration_sec,
    createdAt: r.created_at,
    artistName: a?.team_name ?? r.artist_name ?? '이름 없는 팀',
    artistGenre: a?.genre ?? r.artist_genre ?? '',
    artistPhotos: a?.photos ?? r.artist_photos ?? [],
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
  }
}

/** 클립 피드 — 최신순 */
export function useClipFeed(limit = 60): Query<Clip[]> {
  const [data, setData] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const channelId = useId()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('v_clip_feed')
      .select(
        'id,artist_id,kind,url,thumb_url,title,duration_sec,created_at,artist_name,artist_genre,artist_photos,like_count,comment_count',
      )
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData((rows ?? []).map((r) => toClip(r as unknown as Row)))
      })
    return () => {
      alive = false
    }
  }, [limit, tick])

  // 채널 이름에 인스턴스 id 를 붙입니다 — 같은 훅을 쓰는 화면이 둘이면
  // 이미 subscribe 된 채널에 .on() 을 불러 앱이 죽습니다.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const ch = supabase
      .channel(`clips-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'artist_clips' },
        () => setTick((n) => n + 1),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [channelId])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 한 팀의 클립 — 공연 상세에서 씁니다 */
export function useArtistClips(artistId: string | null | undefined): Query<Clip[]> {
  const [data, setData] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !artistId) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void supabase
      .from('artist_clips')
      .select(
        'id,artist_id,kind,url,thumb_url,title,duration_sec,created_at,artists!artist_clips_artist_id_fkey(team_name,genre,photos)',
      )
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData((rows ?? []).map((r) => toClip(r as unknown as Row)))
      })
    return () => {
      alive = false
    }
  }, [artistId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

export interface NewClip {
  kind: ClipKind
  url: string
  thumbUrl?: string | null
  title?: string
  durationSec?: number | null
}

/** 팀 등록 직후 클립을 한꺼번에 넣습니다 */
export async function addClips(artistId: string, clips: NewClip[]): Promise<string | null> {
  if (clips.length === 0) return null
  const { error } = await supabase.from('artist_clips').insert(
    clips.map((c) => ({
      artist_id: artistId,
      kind: c.kind,
      url: c.url,
      thumb_url: c.thumbUrl ?? null,
      title: c.title ?? '',
      duration_sec: c.durationSec ?? null,
    })),
  )
  return error ? describeDbError(error) : null
}

export async function deleteClip(clipId: string): Promise<string | null> {
  const { error } = await supabase.from('artist_clips').delete().eq('id', clipId)
  return error ? describeDbError(error) : null
}
