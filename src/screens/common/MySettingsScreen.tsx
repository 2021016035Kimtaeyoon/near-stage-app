import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { ThemeToggleCard } from '@/components/ui/ThemeToggleCard'
import { useAuthStore } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { AccountCard } from '@/screens/audience/AccountCard'
import { AccountDangerZone } from '@/screens/audience/AccountDangerZone'
import { NotificationList } from './NotificationList'

/**
 * 호스트·아티스트 모드의 마이 페이지 (/account).
 *
 * ★ 로그인·로그아웃·계정 삭제 진입점이 "공연보기" 탭바의 마이 페이지
 *   (/audience/my)에만 있었습니다. 호스트·아티스트 모드로 계속 쓰던 사람은
 *   로그아웃하거나 계정을 지울 방법이 아예 없었던 셈입니다. 참석 예정·좋아요·
 *   팔로우처럼 관객 전용인 부분은 빼고, 역할과 무관한 부분(계정, 테마, 알림,
 *   약관·삭제)만 담아 세 역할이 함께 씁니다 — audience/my 의 AccountCard·
 *   AccountDangerZone 을 그대로 재사용합니다.
 */
export function MySettingsScreen() {
  const profile = useAuthStore((s) => s.profile)
  const { unread } = useNotifications()

  return (
    <Screen>
      <ScreenHeader
        title={profile ? `안녕하세요, ${profile.displayName}님` : '마이 페이지'}
        subtitle={
          profile ? '역할과 상관없이 이 계정 그대로예요' : '로그인하면 알림을 받을 수 있어요'
        }
      />
      <ScreenBody>
        <AccountCard />
        <ThemeToggleCard />

        <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold">
          알림
          {unread > 0 && (
            <span className="bg-gold-500 tnum flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-gold-ink">
              {unread}
            </span>
          )}
        </h2>
        <NotificationList />

        <AccountDangerZone />

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
