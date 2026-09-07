import { createEmptyData } from '../emptyData'
import { DEFAULT_FILTER } from '../selectors'
import type { AppNotification, Role, UserProfile } from '@/types'
import type { GetState, SetState, ThemeMode } from '../types'

export function createCommonActions(set: SetState, get: GetState) {
  return {
    setProfile: (profile: UserProfile | null) => set({ profile }),

    setRole: (role: Role) => set({ role }),

    setTheme: (theme: ThemeMode) => set({ theme }),

    nextId: (prefix: string): string => {
      const n = get().seq + 1
      set({ seq: n })
      return `${prefix}${n}`
    },

    /** 화면에 올려둔 데이터를 전부 비웁니다 (로그아웃 등) */
    resetAll: () =>
      set({
        ...createEmptyData(),
        profile: null,
        role: 'audience',
        currentVenueId: null,
        currentPerformerId: null,
        seq: 0,
        audienceFilter: { ...DEFAULT_FILTER },
        highlightShowId: null,
      }),

    pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const id = get().nextId('nt')
      const noti: AppNotification = {
        ...n,
        id,
        createdAt: new Date().toISOString(),
        read: false,
      }
      set((s) => ({ notifications: [noti, ...s.notifications] }))
    },

    markNotificationRead: (id: string) =>
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      })),

    markAllNotificationsRead: (role: Role) =>
      set((s) => ({
        notifications: s.notifications.map((n) => (n.role === role ? { ...n, read: true } : n)),
      })),

    setHighlightShow: (showId: string | null) => set({ highlightShowId: showId }),
  }
}
