import {
  Bell,
  MessageSquare,
  CalendarCheck,
  Clapperboard,
  Compass,
  LayoutDashboard,
  Map,
  Megaphone,
  Store,
  User,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export interface TabItem {
  to: string
  label: string
  icon: LucideIcon
  /** 이 경로들로 시작하면 탭이 활성 상태 */
  matches: string[]
}

export const TABS: Record<Role, TabItem[]> = {
  audience: [
    { to: '/audience/home', label: '홈', icon: Map, matches: ['/audience/home', '/audience/show'] },
    { to: '/audience/clips', label: '클립', icon: Clapperboard, matches: ['/audience/clips'] },
    { to: '/notifications', label: '알림', icon: Bell, matches: ['/notifications'] },
    {
      to: '/audience/my',
      label: '마이',
      icon: User,
      matches: ['/audience/my', '/audience/ticket', '/audience/review'],
    },
  ],
  owner: [
    {
      to: '/owner/dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
      matches: ['/owner/dashboard'],
    },
    { to: '/owner/venue', label: '공간', icon: Store, matches: ['/owner/venue'] },
    {
      to: '/owner/recruit',
      label: '구인',
      icon: Megaphone,
      matches: ['/owner/recruit', '/owner/applicants'],
    },
    { to: '/chat', label: '채팅', icon: MessageSquare, matches: ['/chat'] },
  ],
  performer: [
    {
      to: '/performer/explore',
      label: '장소 탐색',
      icon: Compass,
      matches: ['/performer/explore', '/performer/venue'],
    },
    {
      to: '/performer/posts',
      label: '구인·역경매',
      icon: Megaphone,
      matches: ['/performer/posts'],
    },
    {
      to: '/performer/activity',
      label: '내 활동',
      icon: CalendarCheck,
      matches: ['/performer/activity'],
    },
    { to: '/chat', label: '채팅', icon: MessageSquare, matches: ['/chat'] },
    { to: '/performer/profile', label: '프로필', icon: UserCircle, matches: ['/performer/profile'] },
  ],
}

export const ROLE_LABEL: Record<Role, string> = {
  audience: '공연보기',
  owner: '호스트',
  performer: '아티스트',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  audience: '오늘 밤 근처에 볼 공연을 찾습니다',
  owner: '한가한 시간대를 공연으로 채웁니다',
  performer: '설 무대를 찾습니다',
}

export const ROLE_HOME: Record<Role, string> = {
  audience: '/audience/home',
  owner: '/owner/dashboard',
  performer: '/performer/explore',
}
