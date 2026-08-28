import { useAppStore } from '@/store/useAppStore'
import { DesktopAudienceHome } from './DesktopAudienceHome'
import { DesktopOwnerHome } from './DesktopOwnerHome'
import { DesktopPerformerHome } from './DesktopPerformerHome'
import { DesktopShell } from './DesktopShell'

/**
 * 데스크톱 웹앱 홈. 랜딩페이지(`/landing`)의 CTA가 이 화면으로 연결됩니다.
 * 모바일 프로토타입(`/`)과 같은 zustand 스토어를 공유해, 상단에서 역할을
 * 바꾸면 그 역할의 홈 화면이 즉시 바뀝니다.
 */
export function DesktopHome() {
  const role = useAppStore((s) => s.role)

  return (
    <DesktopShell>
      {role === 'audience' && <DesktopAudienceHome />}
      {role === 'owner' && <DesktopOwnerHome />}
      {role === 'performer' && <DesktopPerformerHome />}
    </DesktopShell>
  )
}
