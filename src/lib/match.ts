import type {
  MatchResult,
  NeedCheck,
  Performer,
  PerformerNeed,
  SoundproofGrade,
  Venue,
  VenueEquipment,
} from '@/types'

/**
 * ★ 매칭 실패를 막는 핵심 로직.
 * 공연자의 needs(필요 조건)와 공간의 equipment(규격)를 항목별로 대조합니다.
 */

const SOUNDPROOF_RANK: Record<SoundproofGrade, number> = { 취약: 0, 보통: 1, 좋음: 2 }

function actualLabel(key: PerformerNeed['key'], eq: VenueEquipment): string {
  switch (key) {
    case 'sound':
      return eq.sound ? '음향 보유' : '음향 없음'
    case 'mic':
      return `마이크 ${eq.mic}개`
    case 'piano':
      return eq.piano ? '피아노 있음' : '피아노 없음'
    case 'projector':
      return eq.projector ? '프로젝터 있음' : '프로젝터 없음'
    case 'stageWidthM':
      return `무대 ${eq.stageWidthM}m`
    case 'ceilingHeightM':
      return `천장 ${eq.ceilingHeightM}m`
    case 'powerKw':
      return `전원 ${eq.powerKw}kW`
    case 'soundproof':
      return `방음 ${eq.soundproof}`
    case 'rehearsalAllowed':
      return eq.rehearsalAllowed ? '리허설 가능' : '리허설 불가'
  }
}

function satisfies(need: PerformerNeed, eq: VenueEquipment): boolean {
  switch (need.key) {
    case 'sound':
      return eq.sound === true
    case 'piano':
      return eq.piano === true
    case 'projector':
      return eq.projector === true
    case 'rehearsalAllowed':
      return eq.rehearsalAllowed === true
    case 'mic':
      return eq.mic >= Number(need.value)
    case 'stageWidthM':
      return eq.stageWidthM >= Number(need.value)
    case 'ceilingHeightM':
      return eq.ceilingHeightM >= Number(need.value)
    case 'powerKw':
      return eq.powerKw >= Number(need.value)
    case 'soundproof':
      return SOUNDPROOF_RANK[eq.soundproof] >= SOUNDPROOF_RANK[need.value as SoundproofGrade]
  }
}

export function matchNeeds(performer: Performer, venue: Venue): MatchResult {
  const checks: NeedCheck[] = performer.needs.map((need) => ({
    need,
    ok: satisfies(need, venue.equipment),
    actualLabel: actualLabel(need.key, venue.equipment),
  }))
  const satisfiedCount = checks.filter((c) => c.ok).length
  return {
    checks,
    satisfiedCount,
    totalCount: checks.length,
    allSatisfied: satisfiedCount === checks.length,
  }
}

/* ───────────────── 완성도 게이지 ───────────────── */

/** 공간 정보 입력 완성도 (%) — "완성도 높은 공간이 3배 더 매칭됩니다" */
export function venueCompleteness(venue: Venue): number {
  const eq = venue.equipment
  const items: boolean[] = [
    venue.name.trim().length > 0,
    venue.address.trim().length > 0,
    venue.capacity > 0,
    venue.ownerNote.trim().length >= 10,
    venue.preferredGenres.length > 0,
    venue.availableSlots.some((s) => s.open),
    venue.photoSlotsFilled >= 2,
    eq.stageWidthM > 0,
    eq.ceilingHeightM > 0,
    eq.powerKw > 0,
    eq.mic > 0 || !eq.sound,
    eq.sound || eq.mic === 0,
  ]
  return Math.round((items.filter(Boolean).length / items.length) * 100)
}

/** 공연자 포트폴리오 완성도 (%) */
export function performerCompleteness(p: Performer): number {
  const items: boolean[] = [
    p.teamName.trim().length > 0,
    p.bio.trim().length >= 20,
    p.setlist.length >= 3,
    p.needs.length >= 2,
    p.clipCount >= 1,
    p.clipCount >= 3,
    p.durationMin > 0,
    p.memberCount > 0,
    p.wantedFee >= 0,
    p.baseArea.trim().length > 0,
  ]
  return Math.round((items.filter(Boolean).length / items.length) * 100)
}
