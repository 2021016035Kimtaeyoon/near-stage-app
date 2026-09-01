import { useEffect } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import { DevPanel } from '@/components/shell/DevPanel'
import { PhoneFrame } from '@/components/shell/PhoneFrame'
import { RoleSwitcherFab, RoleSwitcherPanel } from '@/components/shell/RoleSwitcher'
import { TabBar } from '@/components/shell/TabBar'
import { ToastHost } from '@/components/ui/Toast'
import { isFullscreenRoute } from '@/lib/routeUtils'
import { AppRoutes } from '@/routes'
import { DemoCaptionBar } from '@/screens/demo/DemoCaptionBar'
import { DemoEngine } from '@/screens/demo/DemoEngine'
import { DesktopHome } from '@/screens/desktop/DesktopHome'
import { DevCheckScreen } from '@/screens/devcheck/DevCheckScreen'
import { LandingPage } from '@/screens/landing/LandingPage'
import { StyleguideScreen } from '@/screens/styleguide/StyleguideScreen'
import { useAppStore } from '@/store/useAppStore'

/**
 * 최상위 화면 분기.
 * `/landing`, `/desktop`은 모바일 프로토타입과 별개인 데스크톱 전용 화면이라
 * 아이폰 프레임 없이 풀 너비로 렌더링합니다. 그 외 모든 경로는 기존처럼
 * 아이폰 프레임(데스크톱) 또는 풀스크린(모바일)의 모바일 앱 프로토타입입니다.
 */
/** 마이페이지의 테마 선택을 <html data-theme>과 상단바 색에 반영합니다 */
function useThemeSync() {
  const theme = useAppStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#FFFFFF' : '#0B0B0F')
  }, [theme])
}

function AppShell() {
  const { pathname } = useLocation()
  const fullscreen = isFullscreenRoute(pathname)
  const demoActive = useAppStore((s) => s.demo.active)
  useThemeSync()

  if (pathname.startsWith('/landing')) return <LandingPage />
  if (pathname.startsWith('/desktop')) return <DesktopHome />
  // DEV 전용 QA 라우트 — 프로덕션 빌드에서는 import.meta.env.DEV가 정적으로 false가 되어
  // 번들에서 완전히 제거됩니다 (dist/ 산출물에 StyleguideScreen/DevCheckScreen 코드 없음).
  if (import.meta.env.DEV && pathname.startsWith('/styleguide')) return <StyleguideScreen />
  if (import.meta.env.DEV && pathname.startsWith('/devcheck')) return <DevCheckScreen />

  return (
    <PhoneFrame side={<RoleSwitcherPanel />}>
      <div className="absolute inset-0">
        <AppRoutes />
      </div>
      {!fullscreen && !demoActive && <TabBar />}
      {!fullscreen && <RoleSwitcherFab />}
      <DevPanel />
      <ToastHost />
      <DemoEngine />
      <DemoCaptionBar />
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
