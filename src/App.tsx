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
import { LandingPage } from '@/screens/landing/LandingPage'
import { useAppStore } from '@/store/useAppStore'

/**
 * 최상위 화면 분기.
 * `/landing`, `/desktop`은 모바일 프로토타입과 별개인 데스크톱 전용 화면이라
 * 아이폰 프레임 없이 풀 너비로 렌더링합니다. 그 외 모든 경로는 기존처럼
 * 아이폰 프레임(데스크톱) 또는 풀스크린(모바일)의 모바일 앱 프로토타입입니다.
 */
function AppShell() {
  const { pathname } = useLocation()
  const fullscreen = isFullscreenRoute(pathname)
  const demoActive = useAppStore((s) => s.demo.active)

  if (pathname.startsWith('/landing')) return <LandingPage />
  if (pathname.startsWith('/desktop')) return <DesktopHome />

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
