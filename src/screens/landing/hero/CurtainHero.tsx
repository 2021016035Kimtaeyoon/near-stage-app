import type { ReactNode } from 'react'
import { CompactHero } from './CompactHero'
import { FullCurtainHero } from './FullCurtainHero'

/**
 * 커튼 히어로 — 두 페이지가 공유하는 진입점.
 *
 * - `full`   : 605dvh 연출 전체 (1막 개막 + 2막 가로 트랙).
 * - `act1`   : 랜딩용. 커튼이 열리고 로고가 떨어지는 1막까지만(381dvh).
 * - `compact`: 애니메이션 없이 첫 화면 한 장.
 *
 * 두 모드가 같은 무대 부품(stageParts.tsx)을 쓰기 때문에, 색·질감·로고는 항상 같습니다.
 */
export function CurtainHero({
  mode,
  panels,
}: {
  mode: 'full' | 'act1' | 'compact'
  /** 1막 뒤에 같은 고정 구간에서 돌릴 설명 판들 (랜딩 전용) */
  panels?: ReactNode[]
}) {
  if (mode === 'compact') return <CompactHero />
  return <FullCurtainHero act1Only={mode === 'act1'} panels={panels} />
}
