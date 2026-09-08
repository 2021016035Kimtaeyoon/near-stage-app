import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { NotificationList } from './NotificationList'

export function NotificationsScreen() {
  return (
    <Screen>
      <ScreenHeader title="알림센터" />
      <ScreenBody>
        <NotificationList />
        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
