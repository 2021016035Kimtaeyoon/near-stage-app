import type { Role } from '@/types'
import type { SetState, ThemeMode } from '../types'

/**
 * 화면 전역 UI 상태.
 *
 * ★ profile/nextId/resetAll/pushNotification/markNotificationRead/
 *   markAllNotificationsRead 는 지웠습니다. 실제 로그인 상태는 useAuthStore
 *   (hooks/useAuth.ts)가 따로 갖고 있고, 실제 알림은 DB(notifications 테이블 +
 *   hooks/useNotifications.ts)에서 옵니다. 여기 있던 것들은 그 위에 겹쳐진
 *   프로토타입용 그림자였고, 어떤 화면도 읽지 않았습니다.
 */
export function createCommonActions(set: SetState) {
  return {
    setRole: (role: Role) => set({ role }),

    setTheme: (theme: ThemeMode) => set({ theme }),

    setHighlightShow: (showId: string | null) => set({ highlightShowId: showId }),
  }
}
