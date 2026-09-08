import { useCallback, useEffect, useState } from 'react'
import type { NewClip } from '@/hooks/useClips'
import { clipThumbnail } from '@/lib/clipEmbed'
import { GENRES } from '@/types'

/**
 * 아티스트 등록 폼의 입력값 (§8-2).
 *
 * 공간 등록과 같은 구조입니다 — 3스텝, 임시저장, 실제로 채운 항목 수로 계산하는 완성도.
 * 장르·필요 조건은 목록 밖 값도 담을 수 있게 자유 문자열입니다.
 */
export interface ArtistDraft {
  // ① 팀 기본
  teamName: string
  genre: string
  memberCount: string
  durationMin: string
  // ② 소개·셋리스트
  bio: string
  setlist: string[]
  // ③ 필요 장비·사진·영상
  needs: string[]
  photos: string[]
  /** 링크와 올린 영상을 함께 담습니다 (기존 초안 호환을 위해 이름은 유지) */
  clipUrls: NewClip[]
}

export const EMPTY_ARTIST_DRAFT: ArtistDraft = {
  teamName: '',
  genre: GENRES[0],
  memberCount: '1',
  durationMin: '60',
  bio: '',
  setlist: [],
  needs: [],
  photos: [],
  clipUrls: [],
}

export const ARTIST_LIMITS = {
  memberCount: { min: 1, max: 30 },
  durationMin: { min: 10, max: 300 },
} as const

/**
 * 공간에 요구할 수 있는 조건.
 *
 * 공간이 등록한 장비(equipment)와 항목별로 대조합니다. 그래서 문구가 아니라 키로
 * 저장합니다 — 사람이 자유롭게 적으면 기계가 맞춰볼 수 없습니다. 목록에 없는 건
 * '기타'로 적고, 그건 사람이 읽는 참고 사항으로만 씁니다.
 */
export const NEED_OPTIONS = [
  '음향 시스템',
  '마이크 2개 이상',
  '피아노',
  '프로젝터',
  '리허설 가능',
  '무대 가로 3m 이상',
  '천장 높이 2.5m 이상',
  '전원 3kW 이상',
  '방음 좋음',
] as const

const DRAFT_KEY = 'ns-artist-draft'

/**
 * 예전 초안은 clipUrls 가 문자열 배열이었습니다. 그대로 읽으면 c.url 이 undefined 라
 * 등록 화면이 깨집니다 — 저장해 둔 초안을 열었다가 폼이 망가지는 건 최악입니다.
 */
function normalizeClips(raw: unknown): NewClip[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((c): NewClip | null => {
      if (typeof c === 'string') return { kind: 'link', url: c, thumbUrl: clipThumbnail(c) }
      if (c && typeof c === 'object' && typeof (c as NewClip).url === 'string') return c as NewClip
      return null
    })
    .filter((c): c is NewClip => c !== null)
}

/**
 * ★ 수정 모드(editId)는 저장 키를 분리합니다. 같은 키를 쓰면 기존 팀을 불러오는
 *   순간 새로 쓰던 등록 초안이 덮여 사라집니다.
 */
export function useArtistDraft(editId?: string) {
  const key = editId ? `${DRAFT_KEY}-edit-${editId}` : DRAFT_KEY
  const [draft, setDraft] = useState<ArtistDraft>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return EMPTY_ARTIST_DRAFT
      const saved = JSON.parse(raw) as Partial<ArtistDraft>
      return { ...EMPTY_ARTIST_DRAFT, ...saved, clipUrls: normalizeClips(saved.clipUrls) }
    } catch {
      return EMPTY_ARTIST_DRAFT
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      /* 저장이 막혀도 폼은 그대로 동작해야 합니다 */
    }
  }, [draft, key])

  const patch = useCallback((p: Partial<ArtistDraft>) => setDraft((d) => ({ ...d, ...p })), [])
  const clear = useCallback(() => {
    setDraft(EMPTY_ARTIST_DRAFT)
    try {
      localStorage.removeItem(key)
    } catch {
      /* 무시 */
    }
  }, [key])

  /** 서버에서 불러온 값으로 폼을 채웁니다 (수정 모드 첫 진입) */
  const load = useCallback((next: ArtistDraft) => setDraft(next), [])

  return { draft, patch, clear, load }
}

function numOrNull(raw: string, range: { min: number; max: number }): number | null {
  const n = Number(raw)
  if (raw.trim() === '' || !Number.isFinite(n)) return null
  if (n < range.min || n > range.max) return null
  return n
}

export { numOrNull as artistNumOrNull }

export function artistStepErrors(draft: ArtistDraft, step: number): string[] {
  const out: string[] = []
  if (step === 0) {
    if (!draft.teamName.trim()) out.push('팀 이름을 입력해 주세요')
    if (!draft.genre.trim()) out.push('장르를 골라 주세요')
    if (numOrNull(draft.memberCount, ARTIST_LIMITS.memberCount) === null) {
      out.push(`인원을 ${ARTIST_LIMITS.memberCount.min}~${ARTIST_LIMITS.memberCount.max}명 사이로 입력해 주세요`)
    }
    if (numOrNull(draft.durationMin, ARTIST_LIMITS.durationMin) === null) {
      out.push(`공연 길이를 ${ARTIST_LIMITS.durationMin.min}~${ARTIST_LIMITS.durationMin.max}분 사이로 입력해 주세요`)
    }
  }
  return out
}

/** 영상 링크 검증 — 파일은 받지 않고 링크만 받습니다 (§11) */
const CLIP_HOSTS = [
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'vimeo.com',
  'tiktok.com',
  'naver.com',
]

export function validateClipUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url) return '링크를 입력해 주세요'
  let parsed: URL
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return '주소 형식이 올바르지 않아요'
  }
  const host = parsed.hostname.replace(/^www\./, '')
  if (!CLIP_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return '유튜브·인스타그램·비메오·틱톡 링크만 넣을 수 있어요'
  }
  return null
}

// youtubeId·clipThumbnail 은 lib/clipEmbed 로 옮겼습니다 — 임베드 주소를 만드는
// 로직과 같은 파싱을 두 벌 두면 한쪽만 고치는 일이 생깁니다.

export function artistCompleteness(draft: ArtistDraft): number {
  const checks: boolean[] = [
    draft.teamName.trim() !== '',
    draft.genre.trim() !== '',
    numOrNull(draft.memberCount, ARTIST_LIMITS.memberCount) !== null,
    numOrNull(draft.durationMin, ARTIST_LIMITS.durationMin) !== null,
    draft.bio.trim().length >= 20,
    draft.setlist.length > 0,
    draft.needs.length > 0,
    draft.photos.length > 0,
    draft.clipUrls.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/**
 * DB 행 → 폼 값 (수정 모드).
 *
 * 클립은 여기서 다루지 않습니다 — artist_clips 표가 원천이고, 클립 관리 화면에서
 * 따로 올리고 지웁니다. 여기 넣으면 저장할 때마다 같은 클립이 다시 들어갑니다.
 */
export function artistRowToDraft(row: Record<string, unknown>): ArtistDraft {
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : [])
  return {
    ...EMPTY_ARTIST_DRAFT,
    teamName: str(row.team_name),
    genre: str(row.genre),
    memberCount: str(row.member_count),
    durationMin: str(row.duration_min),
    bio: str(row.bio),
    setlist: arr(row.setlist),
    needs: arr(row.needs),
    photos: arr(row.photos),
    clipUrls: [],
  }
}
