import { getShowStatus } from '@/store/selectors'
import type { AppState } from '@/store/types'

export interface InvariantResult {
  id: string
  label: string
  description: string
  ok: boolean
  /** 위반이 있을 때 원인이 되는 엔티티 id 목록 (최대 5개만 화면에 표시) */
  offenders: string[]
}

type Check = (s: AppState) => InvariantResult

/**
 * 화면에 보이는 값(가격, 정원, 랭킹 등)은 전부 store 데이터에서 계산되고,
 * 서로 다른 엔티티 간 참조가 깨지지 않아야 한다는 §13/§18 규칙을 실제로
 * 검증하는 개발용 무결성 체크. 프로덕션에는 절대 노출하지 않습니다(App.tsx에서 DEV 가드).
 */
const CHECKS: Check[] = [
  (s) => {
    const offenders = s.shows
      .filter((sh) => sh.venueId && !s.venues.some((v) => v.id === sh.venueId))
      .map((sh) => sh.id)
    return {
      id: 'show-venue-ref',
      label: '공연 → 공간 참조 무결성',
      description: '`source: own`인 모든 Show.venueId는 실제 존재하는 Venue를 가리켜야 합니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders = s.shows
      .filter((sh) => sh.performerId && !s.performers.some((p) => p.id === sh.performerId))
      .map((sh) => sh.id)
    return {
      id: 'show-performer-ref',
      label: '공연 → 공연자 참조 무결성',
      description: 'Show.performerId는 실제 존재하는 Performer를 가리켜야 합니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders = s.shows.filter((sh) => sh.reservedCount > sh.capacity).map((sh) => sh.id)
    return {
      id: 'capacity-overflow',
      label: '예약 인원 ≤ 정원',
      description: 'Show.reservedCount는 절대 capacity를 넘을 수 없습니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders = s.reservations
      .filter((r) => !s.shows.some((sh) => sh.id === r.showId))
      .map((r) => r.id)
    return {
      id: 'reservation-show-ref',
      label: '예약 → 공연 참조 무결성',
      description: 'Reservation.showId는 실제 존재하는 Show를 가리켜야 합니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders = s.settlements
      .filter((st) => !s.shows.some((sh) => sh.id === st.showId))
      .map((st) => st.id)
    return {
      id: 'settlement-show-ref',
      label: '정산 → 공연 참조 무결성',
      description: 'Settlement.showId는 실제 존재하는 Show를 가리켜야 합니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders: string[] = []
    for (const post of s.posts) {
      const accepted = post.applications.filter((a) => a.status === '수락')
      if (accepted.length > 1) offenders.push(post.id)
    }
    return {
      id: 'single-acceptance',
      label: '구인글당 수락된 지원은 최대 1건',
      description: '같은 Post에 status가 "수락"인 Application이 2건 이상이면 안 됩니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders: string[] = []
    for (const venue of s.venues) {
      for (const slot of venue.availableSlots) {
        if (slot.bookedShowId && !s.shows.some((sh) => sh.id === slot.bookedShowId)) {
          offenders.push(`${venue.id}/${slot.id}`)
        }
      }
    }
    return {
      id: 'slot-show-ref',
      label: '슬롯 잠금 → 공연 참조 무결성',
      description: 'TimeSlot.bookedShowId가 있으면 그 Show가 실제로 존재해야 합니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders = [...s.venues.filter((v) => v.rating < 0 || v.rating > 5).map((v) => v.id),
      ...s.performers.filter((p) => p.rating < 0 || p.rating > 5).map((p) => p.id)]
    return {
      id: 'rating-range',
      label: '평점은 0~5 범위',
      description: '리뷰 반영 후에도 Venue/Performer.rating은 0 이상 5 이하여야 합니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
  (s) => {
    const offenders = s.reservations
      .filter((r) => r.status === '취소' && r.refundAmount == null)
      .map((r) => r.id)
    return {
      id: 'cancelled-has-refund',
      label: '취소된 예약은 환불액을 기록',
      description: 'status가 "취소"인 Reservation은 refundAmount가 null이면 안 됩니다.',
      ok: offenders.length === 0,
      offenders,
    }
  },
]

export function runInvariantChecks(s: AppState): InvariantResult[] {
  return CHECKS.map((check) => check(s))
}

/** 정산대기 settlement 중 실제로는 공연이 이미 끝난 것 — settleAll 호출을 유도하는 참고용 지표 */
export function settleableCount(s: AppState): number {
  return s.settlements.filter((st) => {
    if (st.status !== '정산대기') return false
    const show = s.shows.find((sh) => sh.id === st.showId)
    return show && getShowStatus(show, s.demoNowIso) === '종료'
  }).length
}
