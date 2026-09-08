import { useCallback, useEffect, useState } from 'react'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Query } from './usePublicShows'

/**
 * 공간의 가능 시간(슬롯) (§10).
 *
 * ★ 슬롯은 요일 반복 규칙이 아니라 "구체적인 날짜와 시각"입니다.
 *   DB 가 starts_at/ends_at timestamptz 로 잡혀 있고, 공연은 결국 특정 날짜에
 *   열리기 때문입니다. "매주 반복"은 규칙을 저장하는 게 아니라 그 자리에서 몇 주치
 *   행을 실제로 만들어 줍니다 — 규칙만 저장하면 "그 주는 사정이 있어 못 해요"를
 *   표현할 방법이 없습니다.
 *
 * 이중 예약 방어선은 DB 에 있습니다: UNIQUE(venue_id, starts_at).
 */

export interface Slot {
  id: string
  venueId: string
  startsAt: string
  endsAt: string
  isOpen: boolean
  /** 공연이 확정되어 잠긴 슬롯 */
  lockedByShowId: string | null
}

const EMPTY: never[] = []

function rowToSlot(r: {
  id: string
  venue_id: string
  starts_at: string
  ends_at: string
  is_open: boolean
  locked_by_show_id: string | null
}): Slot {
  return {
    id: r.id,
    venueId: r.venue_id,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    isOpen: r.is_open,
    lockedByShowId: r.locked_by_show_id,
  }
}

/** 지난 슬롯은 보여줄 이유가 없어서 오늘 0시 이후만 가져옵니다 */
export function useSlots(venueId: string | null): Query<Slot[]> {
  const [data, setData] = useState<Slot[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !venueId) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    void supabase
      .from('venue_slots')
      .select('id,venue_id,starts_at,ends_at,is_open,locked_by_show_id')
      .eq('venue_id', venueId)
      .gte('starts_at', since.toISOString())
      .order('starts_at', { ascending: true })
      .limit(200)
      .then(({ data: rows, error: err }) => {
        if (!alive) return
        setLoading(false)
        if (err) {
          setError(describeDbError(err))
          return
        }
        setError(null)
        setData((rows ?? []).map(rowToSlot))
      })
    return () => {
      alive = false
    }
  }, [venueId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, loading, error, refresh }
}

/**
 * 슬롯 추가. repeatWeeks 가 1보다 크면 같은 요일·시각으로 그 주 수만큼 만듭니다.
 *
 * 이미 있는 시각은 UNIQUE 제약에 걸려 통째로 실패하므로, 미리 걸러내고 넣습니다.
 * 몇 개를 만들었는지 돌려줘서 화면이 "3주치 중 2개를 열었습니다"라고 말할 수 있게 합니다.
 */
export async function addSlots(
  venueId: string,
  firstStart: Date,
  firstEnd: Date,
  repeatWeeks: number,
  existing: Slot[],
): Promise<{ created: number; skipped: number; error: string | null }> {
  const taken = new Set(existing.map((s) => new Date(s.startsAt).getTime()))
  const rows: { venue_id: string; starts_at: string; ends_at: string }[] = []
  let skipped = 0

  const week = 7 * 24 * 60 * 60 * 1000
  for (let i = 0; i < Math.max(1, repeatWeeks); i++) {
    const start = new Date(firstStart.getTime() + i * week)
    const end = new Date(firstEnd.getTime() + i * week)
    if (taken.has(start.getTime())) {
      skipped++
      continue
    }
    rows.push({
      venue_id: venueId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    })
  }

  if (rows.length === 0) return { created: 0, skipped, error: null }

  const { error } = await supabase.from('venue_slots').insert(rows)
  if (error) return { created: 0, skipped, error: describeDbError(error) }
  return { created: rows.length, skipped, error: null }
}

/** 슬롯 열기·닫기. 공연이 잡힌 슬롯은 DB 가 아니라 화면에서 먼저 막습니다 */
export async function setSlotOpen(slotId: string, isOpen: boolean): Promise<string | null> {
  const { error } = await supabase.from('venue_slots').update({ is_open: isOpen }).eq('id', slotId)
  return error ? describeDbError(error) : null
}

export async function deleteSlot(slotId: string): Promise<string | null> {
  const { error } = await supabase.from('venue_slots').delete().eq('id', slotId)
  return error ? describeDbError(error) : null
}
