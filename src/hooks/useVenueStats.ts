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
  artistId: string
  title: string
  startsAt: string
  durationMin: number
  capacity: number
  seatMapUrl: string | null
  status: string
  artistName: string
  artistPhotos: string[]
  /** 이 팀이 등록 시 적어둔 필요 장비 — 공연 전 확인 목록이 우리 공간 장비와 대조합니다 */
  artistNeeds: string[]
  /** 참석 예정 인원 합계 */
  goingCount: number
  /** 호스트가 적은 실제 방문객. 안 적었으면 null */
  visitorCount: number | null
  reportNote: string
}

type ArtistJoin = { team_name: string; photos: string[] | null; needs: string[] | null }
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
            'id,venue_id,artist_id,title,starts_at,duration_min,capacity,seat_map_url,status,artists!shows_artist_id_fkey(team_name,photos,needs),show_reports(visitor_count,note)',
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
            artistId: r.artist_id,
            title: r.title,
            startsAt: r.starts_at,
            durationMin: r.duration_min,
            capacity: r.capacity,
            seatMapUrl: r.seat_map_url,
            status: r.status,
            artistName: artist?.team_name ?? '',
            artistPhotos: artist?.photos ?? [],
            artistNeeds: artist?.needs ?? [],
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

/**
 * 정원·좌석 배치도 수정.
 *
 * ★ 정원을 이미 확정된 참석 예정 합계보다 줄일 수 있습니다 — DB는 앞으로의
 *   신규/증원 신청만 막고(0033_ticket_checkin.sql), 이미 받은 참석은 취소하지
 *   않습니다. 정원을 줄이는 건 호스트의 판단이라 우리가 대신 막지 않습니다.
 */
export async function saveShowCapacity(
  showId: string,
  capacity: number,
  seatMapUrl: string | null,
): Promise<string | null> {
  const { error } = await supabase
    .from('shows')
    .update({ capacity, seat_map_url: seatMapUrl })
    .eq('id', showId)
  return error ? describeDbError(error) : null
}

// ============================================================
// 주간 손님 수 — "공연을 하면 손님이 느는가"에 답하는 유일한 방법.
//
// ★ 공연별 방문객(show_reports)만으로는 답이 안 나옵니다. "공연한 날 24명"은
//   평소가 몇 명인지 모르면 아무 의미가 없습니다. 비교 대상이 필요하고,
//   그 대상은 **공연이 없던 주**입니다. 그건 사장님만 압니다.
//
// ★ 끝난 주만 받습니다. 진행 중인 주는 아직 절반이라, 그 값을 지난 주들의
//   평균과 나란히 두면 "공연 주에 손님이 줄었다" 같은 없는 사실이 만들어집니다.
// ============================================================

export interface WeeklyStat {
  id: string
  venueId: string
  /** 그 주 월요일 'YYYY-MM-DD' */
  weekStart: string
  visitorCount: number
  note: string
  /** 그 주에 열린 우리 무대 수 (shows 에서 셈) */
  showCount: number
}

/** 최근 26주치. 그 이상은 계절이 달라서 비교 근거가 되지 않습니다 */
export function useWeeklyStats(venueIds: string[], sinceWeek: string): Query<WeeklyStat[]> {
  const [data, setData] = useState<WeeklyStat[]>([])
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
      const { data: rows, error: err } = await supabase
        .from('v_venue_weekly')
        .select('id,venue_id,week_start,visitor_count,note,show_count')
        .in('venue_id', ids)
        .gte('week_start', sinceWeek)
        .order('week_start', { ascending: false })
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
          venueId: r.venue_id,
          weekStart: r.week_start,
          visitorCount: r.visitor_count,
          note: r.note ?? '',
          showCount: r.show_count ?? 0,
        })),
      )
    })()
    return () => {
      alive = false
    }
  }, [key, sinceWeek, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/** 한 주 손님 수 기록. 같은 주를 다시 적으면 덮어씁니다 */
export async function saveWeeklyStat(
  venueId: string,
  weekStart: string,
  visitorCount: number,
  note: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('venue_weekly_stats')
    .upsert(
      { venue_id: venueId, week_start: weekStart, visitor_count: visitorCount, note },
      { onConflict: 'venue_id,week_start' },
    )
  return error ? describeDbError(error) : null
}

/** 비교를 보여주기 위한 최소 조건 */
const MIN_EACH = 2
const MIN_TOTAL = 4

export interface WeeklyCompare {
  /** 조건을 채웠는지. false 면 avg 값들은 읽지 마세요 */
  ready: boolean
  showWeeks: number
  quietWeeks: number
  showAvg: number
  quietAvg: number
  /** 공연 주 평균 - 없던 주 평균. 음수일 수 있습니다 */
  diff: number
  /** 아직이면 왜 아직인지 한 줄 */
  needLabel: string
}

/**
 * 공연 있던 주 vs 없던 주.
 *
 * ★ 한쪽이 1주뿐이면 평균이 아니라 그냥 그 주 값입니다. 그래서 양쪽 2주 이상,
 *   합쳐서 4주 이상일 때만 보여줍니다. 그 전에는 무엇이 모자란지 그대로 말합니다.
 */
export function compareWeeks(rows: WeeklyStat[]): WeeklyCompare {
  const withShow = rows.filter((r) => r.showCount > 0)
  const without = rows.filter((r) => r.showCount === 0)
  const mean = (xs: WeeklyStat[]) =>
    xs.length === 0 ? 0 : xs.reduce((n, r) => n + r.visitorCount, 0) / xs.length

  const showAvg = mean(withShow)
  const quietAvg = mean(without)
  const ready =
    withShow.length >= MIN_EACH && without.length >= MIN_EACH && rows.length >= MIN_TOTAL

  let needLabel = ''
  if (!ready) {
    if (withShow.length < MIN_EACH) {
      needLabel = `공연이 있던 주 ${MIN_EACH - withShow.length}주가 더 모이면 비교를 보여드려요`
    } else if (without.length < MIN_EACH) {
      needLabel = `공연이 없던 주 ${MIN_EACH - without.length}주가 더 모이면 비교를 보여드려요`
    } else {
      needLabel = `${MIN_TOTAL - rows.length}주만 더 적으면 비교를 보여드려요`
    }
  }

  return {
    ready,
    showWeeks: withShow.length,
    quietWeeks: without.length,
    showAvg,
    quietAvg,
    diff: showAvg - quietAvg,
    needLabel,
  }
}


/**
 * 이 시간 안에 시작하는 공연 — "공연 전 확인" 섹션이 다룰 대상입니다.
 *
 * screens/owner/PreShowChecklist.tsx 와 화면(OwnerDashboard 등) 양쪽이 같은
 * 기준으로 "지금 섹션을 보여줄지"와 "무엇을 보여줄지"를 판단해야 해서, 이 표를
 * 화면 컴포넌트가 아니라 여기 하나에 둡니다.
 */
const SOON_MS = 3 * 24 * 60 * 60 * 1000

export function soonShows(shows: VenueShow[], nowIso: string): VenueShow[] {
  const now = new Date(nowIso).getTime()
  return shows.filter((s) => {
    const start = new Date(s.startsAt).getTime()
    return s.status !== 'canceled' && start >= now && start - now <= SOON_MS
  })
}
