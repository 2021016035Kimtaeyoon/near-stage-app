import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { DEFAULT_FILTER } from './selectors'
import { createAudienceActions } from './actions/audience'
import { createCommonActions } from './actions/common'
import type { AppStore, SetState } from './types'

/**
 * 전역 스토어.
 *
 * ★ 화면이 실제로 쓰는 UI 상태만 남았습니다 — 역할·테마·지도 필터·강조 표시·
 *   최근 본 공연. 그 밖의 데이터(공간·팀·공연·구인글·채팅·알림·리뷰…)는 전부
 *   DB 가 원천이고 `src/hooks/use*.ts` 에서 읽습니다.
 *
 * ★ 예전에는 여기에 그 DB 데이터를 흉내 낸 프로토타입 상태 전체
 *   (venues/performers/shows/posts/reverseBids/reservations/reviews/
 *   notifications/chatThreads/chatMessages/weeklyStats/likedShowIds/
 *   followedPerformerIds 및 그걸 조작하는 액션 4개 파일 분량)가 그대로 남아
 *   있었습니다. 화면은 전부 실제 훅으로 갈아탔는데 이 자리는 안 걷어내서,
 *   아무도 안 읽는 값을 계속 계산하고 있었습니다 — 예를 들어 `useRoleSync`가
 *   여기 쓰던 currentVenueId/currentPerformerId 는 그걸 읽는 화면이 이미
 *   하나도 없었습니다. 실제 코드가 하는 일과 여기 있던 코드가 말하는 일이
 *   달랐던 것이라, 전부 지웠습니다.
 *
 * ★ localStorage 영속도 없습니다. 애플리케이션 데이터의 원천은 DB이고,
 *   이 스토어는 화면이 쓰는 임시 상태만 들고 있습니다.
 */
export const useAppStore = create<AppStore>()((set) => {
  const s = set as unknown as SetState
  return {
    role: 'audience',
    theme: 'light',
    highlightShowId: null,
    audienceFilter: { ...DEFAULT_FILTER },
    recentlyViewedShowIds: [],

    ...createCommonActions(s),
    ...createAudienceActions(s),
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
