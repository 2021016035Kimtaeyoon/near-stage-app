import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createEmptyData } from './emptyData'
import { DEFAULT_FILTER } from './selectors'
import { createAudienceActions } from './actions/audience'
import { createChatActions } from './actions/chat'
import { createCommonActions } from './actions/common'
import { createOwnerActions } from './actions/owner'
import { createPerformerActions } from './actions/performer'
import type { AppStore, GetState, SetState } from './types'

/**
 * 전역 스토어.
 *
 * ★ localStorage 영속을 걷어냈습니다. 애플리케이션 데이터의 원천은 DB이고,
 *   이 스토어는 화면이 쓰는 임시 상태만 들고 있습니다. 브라우저에 남겨야 하는
 *   UI 설정(테마 등)만 별도로 저장합니다.
 */
export const useAppStore = create<AppStore>()((set, get) => {
  const s = set as unknown as SetState
  const g = get as unknown as GetState
  return {
    ...createEmptyData(),
    profile: null,
    role: 'audience',
    theme: 'light',
    currentVenueId: null,
    currentPerformerId: null,
    seq: 0,
    highlightShowId: null,
    audienceFilter: { ...DEFAULT_FILTER },

    ...createCommonActions(s, g),
    ...createAudienceActions(s, g),
    ...createOwnerActions(s, g),
    ...createPerformerActions(s, g),
    ...createChatActions(s, g),
  }
})

/**
 * 앱 전체가 쓰는 "지금".
 *
 * 예전에는 고정된 시연용 시각을 썼지만 이제 실제 시각입니다. 1분마다 갱신해서
 * "곧 시작", "진행 중" 같은 표시가 화면을 켜둔 채로도 따라 움직이게 합니다.
 */
export function useNow(): string {
  const [now, setNow] = useState(() => new Date().toISOString())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}
