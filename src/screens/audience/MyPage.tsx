import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Segmented } from '@/components/ui/Chip'
import { DEMO_AUDIENCE_NAME } from '@/config/brand'
import { useAppStore } from '@/store/useAppStore'
import { NotificationList } from '@/screens/common/NotificationList'
import { EventsPanel } from './EventsPanel'
import { MembershipCard } from './MembershipCard'
import { MyFollowedPerformers, MyLikedShows } from './MyLikesFollows'
import { MyReservations } from './MyReservations'

type Tab = 'reservation' | 'liked' | 'follow' | 'noti' | 'events'

export function MyPage() {
  const [tab, setTab] = useState<Tab>('reservation')
  const reservations = useAppStore((s) => s.reservations)
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const notifications = useAppStore((s) => s.notifications)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

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

        <MembershipCard />

        <div className="card mb-4 flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            {theme === 'light' ? (
              <Sun size={17} className="text-gold-500" />
            ) : (
              <Moon size={17} className="text-gold-500" />
            )}
            <div>
              <p className="text-[13px] font-bold">화면 테마</p>
              <p className="mt-0.5 text-2xs text-ink-3">다크·라이트 배경을 바꿀 수 있어요</p>
            </div>
          </div>
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'dark', label: '다크' },
              { value: 'light', label: '라이트' },
            ]}
          />
        </div>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'reservation', label: '예약' },
            { value: 'liked', label: '좋아요' },
            { value: 'follow', label: '팔로우' },
            { value: 'noti', label: '알림' },
            { value: 'events', label: '이벤트' },
          ]}
        />

        <div className="mt-4">
          {tab === 'reservation' && <MyReservations />}
          {tab === 'liked' && <MyLikedShows />}
          {tab === 'follow' && <MyFollowedPerformers />}
          {tab === 'noti' && <NotificationList role="audience" />}
          {tab === 'events' && <EventsPanel />}
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
