import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 호스트 성과 리포트 (§14).
 *
 * ★ "예상 추가 집객" 같은 추정치를 만들지 않습니다. 공연이 없던 날의 방문객 수를
 *   우리가 알 방법이 없어서, 비교값을 지어내면 그건 그냥 거짓말입니다.
 *   대신 실제로 아는 두 숫자만 보여줍니다 — 참석 예정 몇 명이었고, 실제로 몇 명
 *   왔는지(호스트가 적어준 값).
 *
 * 실제 방문객은 호스트가 공연이 끝난 뒤 직접 적습니다(show_reports). 안 적으면
 * 비워두고, 채우라고 안내합니다. 0으로 채워 넣으면 "손님이 안 왔다"로 읽힙니다.
 */

export interface VenueShow {
  id: string
  venueId: string
  title: string
  startsAt: string
  durationMin: number
  capacity: number
  status: string
  artistName: string
  artistPhotos: string[]
  /** 참석 예정 인원 합계 */
  goingCount: number
  /** 호스트가 적은 실제 방문객. 안 적었으면 null */
  visitorCount: number | null
  reportNote: string
}

type ArtistJoin = { team_name: string; photos: string[] | null }
type ReportJoin = { visitor_count: number; note: string | null }

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v === undefined || v === null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/**
 * 내 공간들의 공연 전부 (지난 것 포함).
 *
 * 참석 예정 합계는 attendances 를 직접 세어 옵니다 — 공간 주인은 자기 공연의
 * 참석자를 볼 수 있습니다(RLS). v_public_shows 의 집계를 쓰지 않는 이유는, 공간이
 * 심사 중으로 바뀌면 뷰에서 빠져 자기 공연이 사라지기 때문입니다.
 */
export function useVenueShows(venueIds: string[]): Query<VenueShow[]> {
  const [data, setData] = useState<VenueShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const key = venueIds.join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (!isSupabaseConfigured || ids.length === 0) {
      setData([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void (async () => {
      const [s, a] = await Promise.all([
        supabase
          .from('shows')
          .select(
            'id,venue_id,title,starts_at,duration_min,capacity,status,artists!shows_artist_id_fkey(team_name,photos),show_reports(visitor_count,note)',
          )
          .in('venue_id', ids)
          .order('starts_at', { ascending: false })
          .limit(200),
        supabase.from('attendances').select('show_id,headcount,status'),
      ])
      if (!alive) return
      setLoading(false)
      if (s.error) {
        setError(describeDbError(s.error))
        return
      }
      setError(null)

      const going = new Map<string, number>()
      for (const r of a.data ?? []) {
        if (r.status === 'canceled') continue
        going.set(r.show_id, (going.get(r.show_id) ?? 0) + r.headcount)
      }

      setData(
        (s.data ?? []).map((r) => {
          const artist = one(r.artists as ArtistJoin | ArtistJoin[] | null)
          const report = one(r.show_reports as ReportJoin | ReportJoin[] | null)
          return {
            id: r.id,
            venueId: r.venue_id,
            title: r.title,
            startsAt: r.starts_at,
            durationMin: r.duration_min,
            capacity: r.capacity,
            status: r.status,
            artistName: artist?.team_name ?? '',
            artistPhotos: artist?.photos ?? [],
            goingCount: going.get(r.id) ?? 0,
            visitorCount: report?.visitor_count ?? null,
            reportNote: report?.note ?? '',
          }
        }),
      )
    })()
    return () => {
      alive = false
    }
  }, [key, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 실제 방문객 기록. 한 공연에 하나만 있습니다(show_id unique) */
export async function saveShowReport(
  showId: string,
  visitorCount: number,
  note: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('show_reports')
    .upsert({ show_id: showId, visitor_count: visitorCount, note }, { onConflict: 'show_id' })
  return error ? describeDbError(error) : null
}

export interface VenueSummary {
  /** 이번 달 공연 수 */
  monthShows: number
  /** 이번 달 참석 예정 합계 */
  monthGoing: number
  /** 실제 방문객 합계 (보고된 공연만) */
  reportedVisitors: number
  /** 방문객을 적은 공연 수 */
  reportedShows: number
  /** 이미 끝났는데 아직 안 적은 공연 수 */
  awaitingReport: number
}

/** 요약 — 전부 실제 값입니다. 없으면 0 이고, 추정치는 만들지 않습니다 */
export function summarize(shows: VenueShow[], nowIso: string): VenueSummary {
  const now = new Date(nowIso)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let monthShows = 0
  let monthGoing = 0
  let reportedVisitors = 0
  let reportedShows = 0
  let awaitingReport = 0

  for (const s of shows) {
    const start = new Date(s.startsAt).getTime()
    if (start >= monthStart) {
      monthShows++
      monthGoing += s.goingCount
    }
    if (s.visitorCount !== null) {
      reportedVisitors += s.visitorCount
      reportedShows++
    } else if (start + s.durationMin * 60_000 < now.getTime() && s.status !== 'canceled') {
      awaitingReport++
    }
  }

  return { monthShows, monthGoing, reportedVisitors, reportedShows, awaitingReport }
}

/**
 * 공연 취소.
 *
 * ★ 상태만 바꾸지 않습니다. fn_cancel_show 가 트랜잭션으로 슬롯을 다시 열고
 *   참석 예정을 눌러둔 관객과 상대방에게 사유를 알립니다. 상태만 바꾸면 그 시간이
 *   영구히 잠기고, 관객은 모르고 찾아옵니다.
 *
 * 호스트와 아티스트 양쪽 다 부를 수 있습니다 — 못 오게 된 쪽은 아티스트인 경우가
 * 더 많습니다.
 */
export async function cancelShow(showId: string, reason: string): Promise<string | null> {
  const { error } = await supabase.rpc('fn_cancel_show', {
    p_show_id: showId,
    p_reason: reason,
  })
  return error ? describeDbError(error) : null
}
