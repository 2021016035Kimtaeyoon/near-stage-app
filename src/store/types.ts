import type {
  AppNotification,
  Application,
  AudienceFilter,
  BidProposal,
  Genre,
  Performer,
  Post,
  Reservation,
  Review,
  ReverseBid,
  Role,

  TimeSlot,
  UserProfile,
  Venue,
} from '@/types'
import type { AppData } from './emptyData'

export type ThemeMode = 'dark' | 'light'

export interface AppState extends AppData {
  /** 로그인한 사용자. 비로그인 상태면 null */
  profile: UserProfile | null
  /** 현재 보고 있는 역할 */
  role: Role
  /** 화면 배경 테마 — 마이페이지에서 전환. 랜딩 히어로는 이 값과 무관하게 항상 다크 */
  theme: ThemeMode
  /** 지금 호스트 화면에서 보고 있는 공간 (보유 공간이 없으면 null) */
  currentVenueId: string | null
  /** 지금 아티스트 화면에서 보고 있는 팀 (보유 팀이 없으면 null) */
  currentPerformerId: string | null
  /** 런타임 생성 엔티티 id 시퀀스 */
  seq: number
  /** 갓 생성된 공연 id — 지도 핀 팝 애니메이션용. Realtime 수신 시 채워집니다 */
  highlightShowId: string | null
  /** 관객 지도 필터 */
  audienceFilter: AudienceFilter
}

export interface AcceptResult {
  showId: string
  startAt: string
}

export interface AppActions {
  /* 공통 */
  setProfile: (profile: UserProfile | null) => void
  setRole: (role: Role) => void
  setTheme: (theme: ThemeMode) => void
  resetAll: () => void
  nextId: (prefix: string) => string
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (role: Role) => void
  setHighlightShow: (showId: string | null) => void

  /* 관객 */
  setAudienceFilter: (patch: Partial<AudienceFilter>) => void
  toggleLike: (showId: string) => void
  addRecentlyViewedShow: (showId: string) => void
  toggleFollow: (performerId: string) => void
  /** 참석 예정 등록 — 결제 없음 */
  createReservation: (showId: string, headcount: number) => Reservation
  cancelReservation: (reservationId: string) => boolean
  checkInReservation: (reservationId: string) => boolean
  addReview: (input: Omit<Review, 'id' | 'createdAt'>) => void

  /* 관심 조건 */
  /** 지금 화면 필터를 관심 조건으로 저장. 같은 조건이 이미 있으면 그것을 그대로 돌려줍니다 */
  /** 새 공연이 열렸을 때 관심 조건과 대조해 관객 알림을 발송합니다 */

  /* 호스트 */
  updateVenue: (venueId: string, patch: Partial<Venue>) => void
  updateVenueEquipment: (venueId: string, patch: Partial<Venue['equipment']>) => void
  toggleSlotOpen: (venueId: string, slotId: string) => boolean
  addSlot: (venueId: string, slot: Omit<TimeSlot, 'id'>) => void
  removeSlot: (venueId: string, slotId: string) => void
  createPost: (input: Omit<Post, 'id' | 'createdAt' | 'applications' | 'closed'>) => Post
  acceptApplication: (postId: string, applicationId: string, startAt: string) => AcceptResult | null
  rejectApplication: (postId: string, applicationId: string, reason: string) => void
  /** 긴급 매칭 요청을 발송하고, 방금 생성된 구인글 id를 반환합니다 */
  sendUrgentMatch: (venueId: string, message: string) => string

  /* 아티스트 */
  updatePerformer: (performerId: string, patch: Partial<Performer>) => void
  applyToPost: (postId: string, performerId: string, message: string) => Application
  createReverseBid: (input: Omit<ReverseBid, 'id' | 'createdAt' | 'proposals'>) => ReverseBid
  addBidProposal: (bidId: string, proposal: BidProposal) => void

  /* 채팅 */
  ensureThread: (venueId: string, performerId: string) => string
  sendMessage: (threadId: string, from: Role, text: string) => void
  markThreadRead: (threadId: string) => void
}

export type AppStore = AppState & AppActions

export type SetState = (
  partial: Partial<AppStore> | ((s: AppStore) => Partial<AppStore>),
) => void
export type GetState = () => AppStore

/** 구인글 작성 폼 기본값에 쓰는 타입 */
export interface PostDraft {
  wantedGenres: Genre[]
  from: string
  to: string
  offerFee: number
  message: string
}
