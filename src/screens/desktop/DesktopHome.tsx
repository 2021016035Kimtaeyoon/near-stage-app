import { useLocation } from 'react-router-dom'
import { ROLE_HOME } from '@/config/nav'
import { AppRoutes } from '@/routes'
import { useAppStore } from '@/store/useAppStore'
import { DesktopAudienceHome } from './DesktopAudienceHome'
import { DesktopOwnerHome } from './DesktopOwnerHome'
import { DesktopPerformerHome } from './DesktopPerformerHome'
import { DesktopShell } from './DesktopShell'

/**
 * 데스크톱 웹앱 홈. 랜딩페이지(`/landing`)의 CTA가 이 화면으로 연결됩니다.
 * 모바일 프로토타입(`/`)과 같은 zustand 스토어를 공유해, 상단에서 역할을
 * 바꾸면 그 역할의 홈 화면이 즉시 바뀝니다.
 *
 * 역할별 "홈" 탭(지도, 대시보드, 장소 탐색)만 데스크톱 전용 2단 레이아웃이고,
 * 나머지 하단 탭(클립·마이·알림·구인·정산·활동·프로필 등)은 모바일과 동일한
 * 화면 컴포넌트를 `/desktop` 접두사가 붙은 경로로 그대로 재사용합니다.
 */
export function DesktopHome() {
  const role = useAppStore((s) => s.role)
  const location = useLocation()
  const subPath = location.pathname.replace(/^\/desktop/, '') || '/'
  const isHome = subPath === '/' || subPath === ROLE_HOME[role]

  return (
    <DesktopShell>
      {isHome ? (
        <>
          {role === 'audience' && <DesktopAudienceHome />}
          {role === 'owner' && <DesktopOwnerHome />}
          {role === 'performer' && <DesktopPerformerHome />}
        </>
      ) : (
        <div className="mx-auto h-full w-full max-w-2xl">
          <AppRoutes prefix="/desktop" />
        </div>
      )}
    </DesktopShell>
  )
}
