import { useEffect } from 'react'
import { CurtainHero } from './hero/CurtainHero'
import {
  ClosingSection,
  DifferentiationSection,
  FeaturesSection,
  RolesSection,
  StatsBand,
} from './LandingSections'
import { ScreenshotShowcase } from './ScreenshotShowcase'

/**
 * 발표 전용 페이지 (/#/pitch).
 *
 * 심사·투자 설명용입니다. 헤더 내비게이션 없이 커튼 개막 연출을 전체화면으로 재생합니다.
 * ★ 사이트 안 어디에서도 이 페이지로 링크하지 않습니다 — 발표 때 URL을 직접 입력합니다.
 *
 * 화면 미리보기는 목데이터 카드가 아니라 **실제 서비스 스크린샷 이미지**입니다.
 * 가상 데이터를 코드로 남기지 않기 위해, 화면을 그리는 대신 사진으로 붙였습니다.
 */
export function PitchPage() {
  // 검색엔진에 노출될 페이지가 아닙니다. 페이지를 떠나면 원래대로 되돌립니다.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => {
      meta.remove()
    }
  }, [])

  return (
    <div data-theme="dark" className="min-h-screen w-full bg-bg text-ink">
      <CurtainHero mode="full" />

      <ScreenshotShowcase />
      <StatsBand />
      <DifferentiationSection />
      <RolesSection />
      <FeaturesSection />
      <ClosingSection />
    </div>
  )
}
