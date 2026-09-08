import { useCallback, useEffect, useState } from 'react'
import { VENUE_CATEGORIES } from '@/types'

/**
 * 공간 등록 폼의 입력값.
 *
 * 임시저장을 위해 브라우저에 남깁니다. ★ 애플리케이션 데이터를 localStorage 에 두지
 * 않는다는 원칙(§15)의 예외가 아닙니다 — 이건 "아직 제출하지 않은 입력 중인 폼",
 * 즉 UI 상태입니다. 제출하면 DB 로 가고 여기서 지웁니다.
 */
export interface VenueDraft {
  // ① 기본정보
  name: string
  /**
   * 목록에 없는 형태의 공간도 있습니다(복합문화공간, 서점, 공방…). 그래서 자유
   * 문자열입니다. DB 컬럼도 text 라 그대로 들어갑니다.
   */
  category: string
  address: string
  addressDetail: string
  district: string
  lat: number | null
  lng: number | null
  // ② 규모·조건
  capacity: string
  rentalFee: string
  /** 우리 장르 목록 밖의 것도 담깁니다 ('기타'로 직접 입력한 값) */
  preferredGenres: string[]
  // ③ 장비
  stageWidthM: string
  ceilingHeightM: string
  powerKw: string
  sound: boolean
  mic: string
  piano: boolean
  projector: boolean
  soundproof: string
  rehearsalAllowed: boolean
  // ④ 사진·소개
  photos: string[]
  description: string
}

export const EMPTY_DRAFT: VenueDraft = {
  name: '',
  category: VENUE_CATEGORIES[0],
  address: '',
  addressDetail: '',
  district: '',
  lat: null,
  lng: null,
  capacity: '',
  rentalFee: '0',
  preferredGenres: [],
  stageWidthM: '',
  ceilingHeightM: '',
  powerKw: '',
  sound: false,
  mic: '0',
  piano: false,
  projector: false,
  soundproof: '보통',
  rehearsalAllowed: false,
  photos: [],
  description: '',
}

/** 값의 허용 범위 (§8-1) */
export const LIMITS = {
  ceilingHeightM: { min: 2, max: 10 },
  powerKw: { min: 0.5, max: 20 },
  stageWidthM: { min: 0.5, max: 30 },
  capacity: { min: 1, max: 2000 },
  mic: { min: 0, max: 20 },
} as const

const DRAFT_KEY = 'ns-venue-draft'

/**
 * 임시저장 — 4스텝을 채우다 창을 닫아도 다시 채우게 하지 않습니다.
 *
 * ★ 수정 모드(editId)는 저장 키를 분리합니다. 같은 키를 쓰면 기존 공간을 불러오는
 *   순간 새로 쓰던 등록 초안이 덮여 사라집니다.
 */
export function useVenueDraft(editId?: string) {
  const key = editId ? `${DRAFT_KEY}-edit-${editId}` : DRAFT_KEY
  const [draft, setDraft] = useState<VenueDraft>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return EMPTY_DRAFT
      // 저장된 형태가 낡았을 수 있으니 기본값 위에 덮습니다
      return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<VenueDraft>) }
    } catch {
      return EMPTY_DRAFT
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      // 시크릿 모드 등에서 저장이 막혀도 폼은 그대로 동작해야 합니다
    }
  }, [draft, key])

  const patch = useCallback((p: Partial<VenueDraft>) => setDraft((d) => ({ ...d, ...p })), [])
  const clear = useCallback(() => {
    setDraft(EMPTY_DRAFT)
    try {
      localStorage.removeItem(key)
    } catch {
      /* 무시 */
    }
  }, [key])

  /** 서버에서 불러온 값으로 폼을 채웁니다 (수정 모드 첫 진입) */
  const load = useCallback((next: VenueDraft) => setDraft(next), [])

  return { draft, patch, clear, load }
}

/** 숫자 입력을 범위 안의 수로. 비었거나 숫자가 아니면 null */
export function numOrNull(raw: string, range?: { min: number; max: number }): number | null {
  const n = Number(raw)
  if (raw.trim() === '' || !Number.isFinite(n)) return null
  if (range && (n < range.min || n > range.max)) return null
  return n
}

/** 각 스텝을 넘어갈 수 있는지 */
export function stepErrors(draft: VenueDraft, step: number): string[] {
  const out: string[] = []
  if (step === 0) {
    if (!draft.name.trim()) out.push('공간 이름을 입력해 주세요')
    if (!draft.address.trim()) out.push('주소를 검색해 주세요')
    if (draft.lat === null || draft.lng === null) out.push('지도에서 위치를 확정해 주세요')
  }
  if (step === 1) {
    if (numOrNull(draft.capacity, LIMITS.capacity) === null) {
      out.push('수용 인원을 1~2000명 사이로 입력해 주세요')
    }
    if (numOrNull(draft.rentalFee) === null || Number(draft.rentalFee) < 0) {
      out.push('대여료를 입력해 주세요 (무료면 0)')
    }
  }
  if (step === 2) {
    const h = numOrNull(draft.ceilingHeightM, LIMITS.ceilingHeightM)
    if (draft.ceilingHeightM.trim() !== '' && h === null) {
      out.push(`천장 높이는 ${LIMITS.ceilingHeightM.min}~${LIMITS.ceilingHeightM.max}m 사이로 입력해 주세요`)
    }
    const kw = numOrNull(draft.powerKw, LIMITS.powerKw)
    if (draft.powerKw.trim() !== '' && kw === null) {
      out.push(`사용 가능 전원은 ${LIMITS.powerKw.min}~${LIMITS.powerKw.max}kW 사이로 입력해 주세요`)
    }
    const w = numOrNull(draft.stageWidthM, LIMITS.stageWidthM)
    if (draft.stageWidthM.trim() !== '' && w === null) {
      out.push(`무대 가로는 ${LIMITS.stageWidthM.min}~${LIMITS.stageWidthM.max}m 사이로 입력해 주세요`)
    }
  }
  return out
}

/**
 * 완성도 — 실제로 채운 항목 수로 계산합니다 (§8-1).
 * 하드코딩된 퍼센트를 보여주지 않습니다.
 */
export function completeness(draft: VenueDraft): number {
  const checks: boolean[] = [
    draft.name.trim() !== '',
    draft.address.trim() !== '',
    draft.lat !== null && draft.lng !== null,
    numOrNull(draft.capacity, LIMITS.capacity) !== null,
    draft.preferredGenres.length > 0,
    numOrNull(draft.stageWidthM, LIMITS.stageWidthM) !== null,
    numOrNull(draft.ceilingHeightM, LIMITS.ceilingHeightM) !== null,
    numOrNull(draft.powerKw, LIMITS.powerKw) !== null,
    draft.sound,
    numOrNull(draft.mic, LIMITS.mic) !== null && Number(draft.mic) > 0,
    draft.photos.length > 0,
    draft.description.trim().length >= 20,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/**
 * DB 행 → 폼 값 (수정 모드).
 *
 * ★ 주소는 저장할 때 `주소 + 상세`를 한 문자열로 합쳤습니다. 다시 나눌 방법이
 *   없어서 전체를 address 에 넣고 addressDetail 은 비웁니다. 사장님이 상세를
 *   다시 적으면 그때 또 합쳐지므로, 저장을 반복해도 중복되지 않습니다.
 */
export function venueRowToDraft(row: Record<string, unknown>): VenueDraft {
  const eq = (row.equipment ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
  return {
    ...EMPTY_DRAFT,
    name: str(row.name),
    category: str(row.category),
    address: str(row.address),
    addressDetail: '',
    district: EMPTY_DRAFT.district,
    lat: typeof row.lat === 'number' ? row.lat : null,
    lng: typeof row.lng === 'number' ? row.lng : null,
    capacity: str(row.capacity),
    rentalFee: str(row.rental_fee),
    preferredGenres: Array.isArray(row.preferred_genres) ? (row.preferred_genres as string[]) : [],
    stageWidthM: str(eq.stageWidthM),
    ceilingHeightM: str(eq.ceilingHeightM),
    powerKw: str(eq.powerKw),
    sound: eq.sound === true,
    mic: str(eq.mic),
    piano: eq.piano === true,
    projector: eq.projector === true,
    soundproof: str(eq.soundproof) || EMPTY_DRAFT.soundproof,
    rehearsalAllowed: eq.rehearsalAllowed === true,
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    description: str(row.description),
  }
}
