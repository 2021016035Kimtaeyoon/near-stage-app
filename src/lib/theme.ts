import type { Genre, VenueCategory } from '@/types'

/** 브랜드 액센트 — 로고의 블루 계열을 따른 그라데이션 */
export const BRAND_FROM = '#6D93E8'
export const BRAND_TO = '#3D5FC7'
export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_FROM} 0%, ${BRAND_TO} 100%)`

/** 등록 공연(KOPIS) — 무채색 + 얇은 외곽선 */
export const KOPIS_LINE = '#6B6B77'
export const KOPIS_FILL = '#1D1D26'

/** 장르별 색상 9종 — 지도 마커·태그에 일관 적용 */
export const GENRE_COLOR: Record<Genre, string> = {
  밴드: '#FF8A3D',
  마술: '#A56BFF',
  스탠드업: '#FFD24A',
  연극: '#4AA8FF',
  토론: '#7C8AA5',
  솔로파티: '#F25FD0',
  국악: '#4ED4A0',
  DJ: '#35E0E0',
  싱어송라이터: '#9BE34A',
}

/** 장르별 아이콘 이름 (lucide-react 컴포넌트 키) */
export const GENRE_ICON: Record<Genre, string> = {
  밴드: 'Guitar',
  마술: 'Wand2',
  스탠드업: 'Mic',
  연극: 'Drama',
  토론: 'MessagesSquare',
  솔로파티: 'PartyPopper',
  국악: 'Drum',
  DJ: 'Disc3',
  싱어송라이터: 'Music4',
}

/** 지도 마커 안에 그리는 초경량 장르 픽토그램 (SVG path, 24x24 viewBox) */
export const GENRE_GLYPH: Record<Genre, string> = {
  밴드: 'M6 18a3 3 0 106 0 3 3 0 00-6 0M11 15l6-9 3-3 1 1-3 3-9 6',
  마술: 'M4 20L16 8M14 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM19 12l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  스탠드업: 'M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4M9 21h6',
  연극: 'M4 6h7v6a3.5 3.5 0 01-7 0zM13 6h7v6a3.5 3.5 0 01-7 0zM6 9h.01M9 9h.01M15 9h.01M18 9h.01',
  토론: 'M3 5h11v7H8l-3 3v-3H3zM10 14h11v6h-3l-2 2v-2h-6z',
  솔로파티: 'M4 20l5-13 8 8-13 5zM15 4v3M19 8h3M17.5 5.5l2-2',
  국악: 'M3 12c4-6 14-6 18 0-4 6-14 6-18 0zM7 12h10M9 9v6M15 9v6',
  DJ: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 6a3 3 0 100 6 3 3 0 000-6z',
  싱어송라이터: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
}

/** 공간 카테고리별 색상 */
export const CATEGORY_COLOR: Record<VenueCategory, string> = {
  바: '#B98CFF',
  카페: '#FFB35C',
  식당: '#7CD98C',
  공연장: '#6FA8FF',
  스튜디오: '#6FE0D8',
}

/** hex → rgba 문자열 */
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  )
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
