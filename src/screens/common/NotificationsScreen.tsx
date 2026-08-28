import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { useAppStore } from '@/store/useAppStore'
import { NotificationList } from './NotificationList'

export function NotificationsScreen() {
  const role = useAppStore((s) => s.role)
  return (
    <Screen>
      <ScreenHeader title="알림센터" />
      <ScreenBody>
        <NotificationList role={role} />
        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
