import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Segmented } from '@/components/ui/Chip'
import { DEMO_AUDIENCE_NAME } from '@/config/brand'
import { useAppStore } from '@/store/useAppStore'
import { NotificationList } from '@/screens/common/NotificationList'
import { MyFollowedPerformers, MyLikedShows } from './MyLikesFollows'
import { MyReservations } from './MyReservations'

type Tab = 'reservation' | 'liked' | 'follow' | 'noti'

export function MyPage() {
  const [tab, setTab] = useState<Tab>('reservation')
  const reservations = useAppStore((s) => s.reservations)
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const notifications = useAppStore((s) => s.notifications)

  const unread = notifications.filter((n) => n.role === 'audience' && !n.read).length

  return (
    <Screen>
      <ScreenHeader title={`안녕하세요, ${DEMO_AUDIENCE_NAME}님`} subtitle="오늘 밤도 좋은 무대 만나세요" />
      <ScreenBody>
        <div className="card mb-4 grid grid-cols-4 divide-x divide-border overflow-hidden">
          <Stat label="예약" value={reservations.filter((r) => r.status !== '취소').length} />
          <Stat label="좋아요" value={likedShowIds.length} />
          <Stat label="팔로우" value={followedPerformerIds.length} />
          <Stat label="알림" value={unread} />
        </div>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'reservation', label: '예약' },
            { value: 'liked', label: '좋아요' },
            { value: 'follow', label: '팔로우' },
            { value: 'noti', label: '알림' },
          ]}
        />

        <div className="mt-4">
          {tab === 'reservation' && <MyReservations />}
          {tab === 'liked' && <MyLikedShows />}
          {tab === 'follow' && <MyFollowedPerformers />}
          {tab === 'noti' && <NotificationList role="audience" />}
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-3.5">
      <span className="tnum text-lg font-extrabold">{value}</span>
      <span className="mt-0.5 text-2xs text-ink-3">{label}</span>
    </div>
  )
}
