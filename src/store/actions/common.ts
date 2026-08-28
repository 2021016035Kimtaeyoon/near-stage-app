import { DEMO_NOW_ISO, DEMO_OWNER_VENUE_ID, DEMO_PERFORMER_ID } from '@/config/brand'
import { createSeedData } from '@/data/seed'
import { DEFAULT_FILTER } from '../selectors'
import type { AppNotification, Role } from '@/types'
import type { GetState, SetState } from '../types'

export function createCommonActions(set: SetState, get: GetState) {
  return {
    setRole: (role: Role) => set({ role }),

    setDemoNow: (iso: string) => set({ demoNowIso: iso }),

    nextId: (prefix: string): string => {
      const n = get().seq + 1
      set({ seq: n })
      return `${prefix}${n}`
    },

    resetAll: () =>
      set({
        ...createSeedData(),
        role: 'audience',
        demoNowIso: DEMO_NOW_ISO,
        currentVenueId: DEMO_OWNER_VENUE_ID,
        currentPerformerId: DEMO_PERFORMER_ID,
        seq: 1000,
        audienceFilter: { ...DEFAULT_FILTER },
        demo: { active: false, stepIndex: 0, playing: false, speed: 1, highlightShowId: null },
      }),

    pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const id = get().nextId('nt')
      const noti: AppNotification = {
        ...n,
        id,
        createdAt: get().demoNowIso,
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

    setHighlightShow: (showId: string | null) =>
      set((s) => ({ demo: { ...s.demo, highlightShowId: showId } })),
  }
}
