/**
 * 장비 조건 대조 (§10).
 *
 * 아티스트가 등록한 `needs`는 자유 텍스트 배열입니다 — 미리 준비한 항목을 고를 수도
 * 있고 "기타"에 직접 적을 수도 있습니다(예: "마이크 1개", "드럼 세트"). 공간의
 * `equipment`는 구조화된 jsonb 입니다. 둘을 맞대려면 텍스트를 조건으로 읽어야 합니다.
 *
 * ★ 읽어내지 못한 항목은 억지로 판정하지 않고 "직접 확인"으로 남깁니다.
 *   못 읽은 걸 충족으로 처리하면 당일 현장에서 사고가 나고, 미충족으로 처리하면
 *   멀쩡한 팀이 걸러집니다. 둘 다 거짓말이라, 사람이 보게 넘깁니다.
 */

export type SoundproofGrade = '취약' | '보통' | '좋음'

export interface VenueEquipment {
  sound?: boolean
  mic?: number
  piano?: boolean
  projector?: boolean
  rehearsalAllowed?: boolean
  stageWidthM?: number
  ceilingHeightM?: number
  powerKw?: number
  soundproof?: SoundproofGrade
}

const SOUNDPROOF_RANK: Record<string, number> = { 취약: 0, 보통: 1, 좋음: 2 }

/** 판정 결과. ok 가 null 이면 "기계가 못 읽어서 사람이 봐야 하는 항목"입니다 */
export interface NeedCheck {
  label: string
  ok: boolean | null
  /** 공간의 실제 값. 못 읽은 항목은 빈 문자열 */
  actual: string
}

export interface MatchResult {
  checks: NeedCheck[]
  /** 판정 가능한 항목 중 충족한 수 */
  okCount: number
  /** 판정 가능한 항목 수 (직접 확인 항목은 빠집니다) */
  judgedCount: number
  /** 명시적으로 미충족인 항목 수 */
  missingCount: number
  /** 사람이 봐야 하는 항목 수 */
  unknownCount: number
}

/** 라벨에서 첫 번째 숫자를 뽑습니다 (소수점 허용). 없으면 null */
function firstNumber(label: string): number | null {
  const m = label.match(/(\d+(?:\.\d+)?)/)
  return m ? Number(m[1]) : null
}

function checkOne(label: string, eq: VenueEquipment): NeedCheck {
  const t = label.trim()
  const has = (...words: string[]) => words.some((w) => t.includes(w))

  // ── 숫자 조건 먼저. "마이크 2개 이상"은 '마이크' 키워드와 숫자를 같이 봅니다 ──
  if (has('마이크')) {
    const need = firstNumber(t) ?? 1
    const actual = eq.mic ?? 0
    return { label: t, ok: actual >= need, actual: `마이크 ${actual}개` }
  }
  if (has('무대') && has('가로', '폭', '너비')) {
    const need = firstNumber(t)
    const actual = eq.stageWidthM ?? 0
    if (need === null) return { label: t, ok: null, actual: '' }
    return { label: t, ok: actual >= need, actual: `무대 가로 ${actual}m` }
  }
  if (has('천장')) {
    const need = firstNumber(t)
    const actual = eq.ceilingHeightM ?? 0
    if (need === null) return { label: t, ok: null, actual: '' }
    return { label: t, ok: actual >= need, actual: `천장 ${actual}m` }
  }
  if (has('전원', '전기', 'kW', 'kw', 'KW')) {
    const need = firstNumber(t)
    const actual = eq.powerKw ?? 0
    if (need === null) return { label: t, ok: null, actual: '' }
    return { label: t, ok: actual >= need, actual: `전원 ${actual}kW` }
  }

  // ── 등급 조건 ──
  if (has('방음')) {
    const grade = (['좋음', '보통', '취약'] as const).find((g) => t.includes(g))
    const actual = eq.soundproof ?? '취약'
    if (!grade) return { label: t, ok: null, actual: `방음 ${actual}` }
    return {
      label: t,
      ok: (SOUNDPROOF_RANK[actual] ?? 0) >= (SOUNDPROOF_RANK[grade] ?? 0),
      actual: `방음 ${actual}`,
    }
  }

  // ── 있고 없고 조건 ──
  if (has('음향', 'PA', '스피커')) {
    return { label: t, ok: eq.sound === true, actual: eq.sound ? '음향 있음' : '음향 없음' }
  }
  if (has('피아노', '건반')) {
    return { label: t, ok: eq.piano === true, actual: eq.piano ? '피아노 있음' : '피아노 없음' }
  }
  if (has('프로젝터', '빔')) {
    return {
      label: t,
      ok: eq.projector === true,
      actual: eq.projector ? '프로젝터 있음' : '프로젝터 없음',
    }
  }
  if (has('리허설', '사운드체크', '사운드 체크')) {
    return {
      label: t,
      ok: eq.rehearsalAllowed === true,
      actual: eq.rehearsalAllowed ? '리허설 가능' : '리허설 불가',
    }
  }

  // 못 읽은 항목 — 지어내지 않습니다
  return { label: t, ok: null, actual: '' }
}

export function matchNeeds(needs: string[], equipment: VenueEquipment | null): MatchResult {
  const eq = equipment ?? {}
  const checks = needs.filter((n) => n.trim()).map((n) => checkOne(n, eq))
  const okCount = checks.filter((c) => c.ok === true).length
  const missingCount = checks.filter((c) => c.ok === false).length
  const unknownCount = checks.filter((c) => c.ok === null).length
  return {
    checks,
    okCount,
    judgedCount: okCount + missingCount,
    missingCount,
    unknownCount,
  }
}

/** 카드 한 줄에 넣을 요약 문구 */
export function matchSummary(m: MatchResult): string {
  if (m.checks.length === 0) return '필요 장비를 적지 않은 팀입니다'
  const parts = [`${m.okCount}/${m.judgedCount} 충족`]
  if (m.unknownCount > 0) parts.push(`직접 확인 ${m.unknownCount}`)
  return parts.join(' · ')
}
