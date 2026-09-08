import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_MAP_CENTER } from '@/config/brand'
import { distanceKm } from '@/lib/geo'
import { PUBLIC_SHOW_COLUMNS, rowToPlace, rowToShow, type PublicShowRow } from '@/lib/dbMap'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { ShowWithMeta } from '@/store/selectors'
import type { Performer } from '@/types'

/**
 * 데이터 훅의 공통 반환 모양.
 *
 * 화면이 로딩·에러·빈 상태를 각자 판단하지 않도록 훅이 함께 돌려줍니다.
 * 그래야 "데이터가 아직 없는 것"과 "가져오다 실패한 것"을 화면이 구분해서
 * 다른 안내를 띄울 수 있습니다.
 */
export interface Query<T> {
  data: T
  loading: boolean
  error: string | null
  /** 다시 불러오기 */
  refresh: () => void
}

/**
 * 사용자 위치.
 *
 * ★ 좌표를 서버로 보내지 않습니다. 브라우저 안에서 거리 계산에만 쓰고 어디에도
 *   저장하지 않습니다 (§8-4, 위치정보법 신고 대상 회피). 권한이 없거나 거부하면
 *   지도 기본 중심을 씁니다.
 */
export function useViewerLocation(): { lat: number; lng: number } {
  const [origin, setOrigin] = useState<{ lat: number; lng: number }>(DEFAULT_MAP_CENTER)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    let alive = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!alive) return
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        // 거부·실패는 정상 흐름입니다. 기본 중심을 그대로 씁니다.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    )
    return () => {
      alive = false
    }
  }, [])

  return origin
}

/**
 * 공개된 공연 목록.
 *
 * v_public_shows 만 읽습니다 — 승인 안 된 공간·아티스트의 공연은 뷰가 이미
 * 걸러내므로, 화면이 승인 여부를 따로 확인할 필요가 없습니다.
 */
export function usePublicShows(): Query<ShowWithMeta[]> {
  const [rows, setRows] = useState<PublicShowRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const origin = useViewerLocation()
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('서버 설정이 없어 공연을 불러올 수 없습니다.')
      return
    }
    setLoading(true)
    void supabase
      .from('v_public_shows')
      .select(PUBLIC_SHOW_COLUMNS)
      .order('starts_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (!alive.current) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setRows((data ?? []) as unknown as PublicShowRow[])
      })
  }, [tick])

  // ★ 새 공연이 확정되면 다시 읽습니다 (§11).
  //   호스트가 수락한 순간 지도를 보고 있던 사람 화면에도 떠야 합니다 — 새로고침을
  //   해야 보이면 "방금 만든 공연이 어디 갔지"가 됩니다.
  //   뷰는 Realtime 을 못 태우므로 원본 테이블 shows 의 INSERT 를 듣고, 신호만
  //   받아서 뷰를 다시 읽습니다 (이벤트 payload 는 쓰지 않습니다 — 뷰가 걸러낸
  //   승인 여부·집계가 payload 에는 없습니다).
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const ch = supabase
      .channel('public-shows')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shows' },
        () => setTick((n) => n + 1),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [])

  const data = useMemo<ShowWithMeta[]>(() => {
    const out: ShowWithMeta[] = []
    for (const row of rows) {
      const place = rowToPlace(row)
      if (!place) continue
      // 아티스트 정보는 목록 표시에 필요한 만큼만 뷰에서 옵니다. 상세 화면은
      // useArtist 훅으로 전체를 따로 읽습니다.
      const performer: Performer | null = row.artist_id
        ? ({
            id: row.artist_id,
            teamName: row.artist_name ?? '',
            genre: rowToShow(row).genre,
            photoSeed: row.artist_id,
          } as Performer)
        : null
      out.push({
        show: rowToShow(row),
        place,
        distanceKm: distanceKm(origin, { lat: place.lat, lng: place.lng }),
        performer,
        rating: row.avg_rating ?? row.venue_rating ?? null,
      })
    }
    return out
  }, [rows, origin])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  return { data, loading, error, refresh }
}

/**
 * 공연 하나 — 상세 화면용.
 * 목록을 거치지 않고 직접 링크로 들어와도 동작해야 하므로 따로 읽습니다.
 */
export function usePublicShow(showId: string | undefined): Query<ShowWithMeta | null> {
  const all = usePublicShows()
  const data = useMemo(
    () => all.data.find((x) => x.show.id === showId) ?? null,
    [all.data, showId],
  )
  return { data, loading: all.loading, error: all.error, refresh: all.refresh }
}
