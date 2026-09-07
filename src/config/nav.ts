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
    // ★ 호스트의 첫 화면은 "내 공간"입니다. 공간을 등록하기 전에는 대시보드가
    //   보여줄 게 없어서, 예전에는 "공간 정보를 찾을 수 없어요"만 떴습니다.
    {
      to: '/host/venue',
      label: '내 공간',
      icon: Store,
      matches: ['/host/venue', '/owner/venue'],
    },
    {
      to: '/owner/dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
      matches: ['/owner/dashboard'],
    },
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

/**
 * 데스크톱 2단 레이아웃(지도+목록, 대시보드)을 쓰는 경로.
 *
 * ROLE_HOME 과 분리한 이유: 호스트의 첫 화면은 "내 공간"인데 그건 2단 레이아웃이
 * 아니라 모바일과 같은 화면을 재사용합니다. 둘을 같은 값으로 두면 /desktop/host/venue
 * 에서 대시보드가 떠버립니다.
 */
export const ROLE_DESKTOP_HOME: Record<Role, string> = {
  audience: '/audience/home',
  owner: '/owner/dashboard',
  performer: '/performer/explore',
}

export const ROLE_HOME: Record<Role, string> = {
  audience: '/audience/home',
  owner: '/host/venue',
  performer: '/performer/explore',
}
