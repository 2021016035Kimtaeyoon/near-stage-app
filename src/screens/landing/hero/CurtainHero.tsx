import { CompactHero } from './CompactHero'
import { FullCurtainHero } from './FullCurtainHero'

/**
 * 커튼 히어로 — 두 페이지가 공유하는 진입점.
 *
 * - `full`   : 발표용(/#/pitch). 스크롤로 커튼이 열리고 로고가 떨어지는 605dvh 연출 전체.
 * - `compact`: 실서비스용(/#/landing). 첫 화면 한 장 안에서 로고·한 줄·CTA 3개를 전부 보여줍니다.
 *
 * 두 모드가 같은 무대 부품(stageParts.tsx)을 쓰기 때문에, 색·질감·로고는 항상 같습니다.
 */
export function CurtainHero({ mode }: { mode: 'full' | 'compact' }) {
  return mode === 'full' ? <FullCurtainHero /> : <CompactHero />
}
