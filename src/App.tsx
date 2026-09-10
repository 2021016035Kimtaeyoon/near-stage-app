import { useEffect, useRef } from 'react'
import { HashRouter, Navigate, useLocation } from 'react-router-dom'
import { PhoneFrame } from '@/components/shell/PhoneFrame'
import { RoleSwitcherFab, RoleSwitcherPanel } from '@/components/shell/RoleSwitcher'
import { TabBar } from '@/components/shell/TabBar'
import { ToastHost } from '@/components/ui/Toast'
import { useAuthSync } from '@/hooks/useAuth'
import { useKakaoCallback } from '@/hooks/useKakaoLogin'
import { isFullscreenRoute } from '@/lib/routeUtils'
import { AppRoutes } from '@/routes'
import { DesktopHome } from '@/screens/desktop/DesktopHome'
import { LoginSheet } from '@/screens/common/LoginSheet'
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
  useAuthSync()
  useKakaoCallback()
  useThemeSync()

  // 데스크톱 웹앱 안에 있는 동안에는, 화면 내부의 navigate()가 접두사 없는 경로
  // (예: '/owner/recruit')로 빠져나가도 다시 '/desktop/...'으로 돌려보냅니다.
  // 이 앱의 화면 60여 개는 전부 접두사 없는 실제 경로로 이동하기 때문에, 개별 화면을
  // 고치는 대신 여기서 한 번에 막는 편이 확실합니다.
  // '/' (모바일 앱 보기)와 '/landing'은 의도적인 이탈이라 예외로 두고 플래그를 끕니다.
  const inDesktopShell = useRef(false)
  if (pathname.startsWith('/desktop')) inDesktopShell.current = true
  if (pathname === '/' || pathname.startsWith('/landing'))
    inDesktopShell.current = false

  // 화면을 먼저 고르고, 토스트·로그인 시트는 아래에서 한 번만 겹칩니다.
  // 로그인 시트를 폰 프레임 안에만 두면 랜딩·데스크톱의 등록 버튼에서 뜨지 않습니다.
  const screen = pickScreen({ pathname, fullscreen, inDesktopShell: inDesktopShell.current })

  return (
    <>
      {screen}
      <ToastHost />
      <LoginSheet />
    </>
  )
}

function pickScreen({
  pathname,
  fullscreen,
  inDesktopShell,
}: {
  pathname: string
  fullscreen: boolean
  inDesktopShell: boolean
}) {
  if (pathname.startsWith('/landing')) return <LandingPage />
  if (pathname.startsWith('/desktop')) return <DesktopHome />
  if (inDesktopShell) return <Navigate to={`/desktop${pathname}`} replace />
  // DEV 전용 QA 라우트 — 프로덕션 빌드에서는 import.meta.env.DEV가 정적으로 false가 되어
  // 번들에서 완전히 제거됩니다 (dist/ 산출물에 StyleguideScreen 코드 없음).
  if (import.meta.env.DEV && pathname.startsWith('/styleguide')) return <StyleguideScreen />

  return (
    <PhoneFrame side={<RoleSwitcherPanel />}>
      <div className="absolute inset-0">
        <AppRoutes />
      </div>
      {!fullscreen && <TabBar />}
      {!fullscreen && <RoleSwitcherFab />}
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
