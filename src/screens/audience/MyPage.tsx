import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Segmented } from '@/components/ui/Chip'
import { FreeTrialNotice } from '@/components/ui/FreeTrialNotice'
import { useMyAttendances, useMyFollows, useMyLikes } from '@/hooks/useEngagement'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/hooks/useAuth'
import { NotificationList } from '@/screens/common/NotificationList'
import { AccountDangerZone } from './AccountDangerZone'
import { MyFollowedPerformers, MyLikedShows } from './MyLikesFollows'
import { AccountCard } from './AccountCard'
import { MyReservations } from './MyReservations'
import { BlockedUsersPanel } from './BlockedUsersPanel'
import { SavedSearchPanel } from './SavedSearchPanel'

type Tab = 'reservation' | 'liked' | 'follow' | 'noti'

export function MyPage() {
  const [tab, setTab] = useState<Tab>('reservation')
  // ★ 예전에는 목 스토어를 읽어서 네 숫자가 로그인해도 전부 0 이었습니다
  const attendances = useMyAttendances()
  const likes = useMyLikes()
  const follows = useMyFollows()
  const { unread } = useNotifications()
  const profile = useAuthStore((s) => s.profile)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)


  return (
    <Screen>
      <ScreenHeader
        title={profile ? `안녕하세요, ${profile.displayName}님` : '마이 페이지'}
        subtitle={profile ? '오늘 밤도 좋은 무대 만나세요' : '로그인하면 참석 예정과 알림을 볼 수 있어요'}
      />
      <ScreenBody>
        <AccountCard />

        <div className="card mb-4 grid grid-cols-4 divide-x divide-border overflow-hidden">
          <Stat
            label="참석 예정"
            value={attendances.data.filter((a) => a.status !== 'canceled').length}
          />
          <Stat label="좋아요" value={likes.data.length} />
          <Stat label="팔로우" value={follows.data.length} />
          <Stat label="알림" value={unread} />
        </div>

        <FreeTrialNotice className="mb-4" />

        <SavedSearchPanel />
        <BlockedUsersPanel />

        <div className="card mb-4 flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            {theme === 'light' ? (
              <Sun size={17} className="text-gold-text" />
            ) : (
              <Moon size={17} className="text-gold-text" />
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
            { value: 'reservation', label: '참석' },
            { value: 'liked', label: '좋아요' },
            { value: 'follow', label: '팔로우' },
            { value: 'noti', label: '알림' },
          ]}
        />

        <div className="mt-4">
          {tab === 'reservation' && <MyReservations />}
          {tab === 'liked' && <MyLikedShows />}
          {tab === 'follow' && <MyFollowedPerformers />}
          {tab === 'noti' && <NotificationList />}
        </div>

        <AccountDangerZone />

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
