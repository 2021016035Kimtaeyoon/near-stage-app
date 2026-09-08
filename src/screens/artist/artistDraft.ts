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

export function useArtistDraft() {
  const [draft, setDraft] = useState<ArtistDraft>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return EMPTY_ARTIST_DRAFT
      const saved = JSON.parse(raw) as Partial<ArtistDraft>
      return { ...EMPTY_ARTIST_DRAFT, ...saved, clipUrls: normalizeClips(saved.clipUrls) }
    } catch {
      return EMPTY_ARTIST_DRAFT
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* 저장이 막혀도 폼은 그대로 동작해야 합니다 */
    }
  }, [draft])

  const patch = useCallback((p: Partial<ArtistDraft>) => setDraft((d) => ({ ...d, ...p })), [])
  const clear = useCallback(() => {
    setDraft(EMPTY_ARTIST_DRAFT)
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* 무시 */
    }
  }, [])

  return { draft, patch, clear }
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
