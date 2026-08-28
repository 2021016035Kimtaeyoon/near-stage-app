import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEMO_NOW_ISO,
  DEMO_OWNER_VENUE_ID,
  DEMO_PERFORMER_ID,
  STORAGE_KEY,
  STORAGE_VERSION,
} from '@/config/brand'
import { createSeedData } from '@/data/seed'
import { DEFAULT_FILTER } from './selectors'
import { createAudienceActions } from './actions/audience'
import { createChatActions } from './actions/chat'
import { createCommonActions } from './actions/common'
import { createOwnerActions } from './actions/owner'
import { createPerformerActions } from './actions/performer'
import type { AppStore, DemoState, GetState, SetState } from './types'

const INITIAL_DEMO: DemoState = {
  active: false,
  stepIndex: 0,
  playing: false,
  speed: 1,
  highlightShowId: null,
  runId: 0,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      const s = set as unknown as SetState
      const g = get as unknown as GetState
      return {
        ...createSeedData(),
        role: 'audience',
        demoNowIso: DEMO_NOW_ISO,
        currentVenueId: DEMO_OWNER_VENUE_ID,
        currentPerformerId: DEMO_PERFORMER_ID,
        seq: 1000,
        audienceFilter: { ...DEFAULT_FILTER },
        demo: INITIAL_DEMO,

        ...createCommonActions(s, g),
        ...createAudienceActions(s, g),
        ...createOwnerActions(s, g),
        ...createPerformerActions(s, g),
        ...createChatActions(s, g),

        setDemo: (patch: Partial<DemoState>) => set((st) => ({ demo: { ...st.demo, ...patch } })),

        /** 자동 시연을 처음부터 다시 돌리기 위해 데이터를 초기 상태로 되돌립니다 */
        resetDemoScenario: () => {
          const prevRunId = get().demo.runId
          set({
            ...createSeedData(),
            role: 'owner',
            demoNowIso: DEMO_NOW_ISO,
            currentVenueId: DEMO_OWNER_VENUE_ID,
            currentPerformerId: DEMO_PERFORMER_ID,
            seq: 2000,
            audienceFilter: { ...DEFAULT_FILTER },
            demo: { ...INITIAL_DEMO, active: true, playing: true, runId: prevRunId + 1 },
          })
        },
      }
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // 데모 재생 상태는 저장하지 않습니다 (새로고침 시 자동 재생 방지)
      partialize: (state) => {
        const { demo: _demo, ...rest } = state
        return rest as unknown as AppStore
      },
      migrate: () => ({}) as AppStore,
    },
  ),
)

/** 앱 전체가 쓰는 "지금" */
export function useNow(): string {
  return useAppStore((s) => s.demoNowIso)
}
