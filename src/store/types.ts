import type { AudienceFilter, Role } from '@/types'

export type ThemeMode = 'dark' | 'light'

export interface AppState {
  /** 현재 보고 있는 역할 */
  role: Role
  /** 화면 배경 테마 — 마이페이지에서 전환. 랜딩 히어로는 이 값과 무관하게 항상 다크 */
  theme: ThemeMode
  /** 갓 생성된 공연 id — 지도 핀 팝 애니메이션용. Realtime 수신 시 채워집니다 */
  highlightShowId: string | null
  /** 관객 지도 필터 */
  audienceFilter: AudienceFilter
  /** 이 브라우저 세션에서 최근에 연 공연 id (최신순, 최대 10개) */
  recentlyViewedShowIds: string[]
}

export interface AppActions {
  setRole: (role: Role) => void
  setTheme: (theme: ThemeMode) => void
  setHighlightShow: (showId: string | null) => void
  setAudienceFilter: (patch: Partial<AudienceFilter>) => void
  addRecentlyViewedShow: (showId: string) => void
}

export type AppStore = AppState & AppActions

export type SetState = (
  partial: Partial<AppStore> | ((s: AppStore) => Partial<AppStore>),
) => void
