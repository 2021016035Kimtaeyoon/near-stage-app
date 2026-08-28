import type { SeedData } from '@/data/seed'
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
  Venue,
} from '@/types'

/** 자동 시연 시나리오 상태 */
export interface DemoState {
  active: boolean
  stepIndex: number
  playing: boolean
  /** 0.5 | 1 | 2 */
  speed: number
  /** 방금 지도에 추가된 공연 id — 핀 팝 애니메이션용 */
  highlightShowId: string | null
  /** "처음부터" 실행마다 증가 — 시연 엔진이 진행 상태(ctx)를 리셋하는 신호로 씁니다 */
  runId: number
}

export interface AppState extends SeedData {
  /** 현재 보고 있는 역할 */
  role: Role
  /** 앱 전체의 "지금" — 실제 시스템 시각을 쓰지 않습니다 */
  demoNowIso: string
  /** 공간주 역할로 로그인한 사장님의 공간 */
  currentVenueId: string
  /** 공연자 역할로 로그인한 팀 */
  currentPerformerId: string
  /** 런타임 생성 엔티티 id 시퀀스 */
  seq: number
  demo: DemoState
  /** 관객 지도 필터 (자동 시연이 조작할 수 있도록 전역 상태로 둡니다) */
  audienceFilter: AudienceFilter
}

export interface AcceptResult {
  showId: string
  startAt: string
}

export interface AppActions {
  /* 공통 */
  setRole: (role: Role) => void
  setDemoNow: (iso: string) => void
  resetAll: () => void
  nextId: (prefix: string) => string
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (role: Role) => void
  setHighlightShow: (showId: string | null) => void

  /* 관객 */
  setAudienceFilter: (patch: Partial<AudienceFilter>) => void
  toggleLike: (showId: string) => void
  toggleFollow: (performerId: string) => void
  createReservation: (showId: string, headcount: number) => Reservation
  cancelReservation: (reservationId: string) => void
  addReview: (input: Omit<Review, 'id' | 'createdAt'>) => void

  /* 공간주 */
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
  settleAll: (venueId: string) => number

  /* 공연자 */
  updatePerformer: (performerId: string, patch: Partial<Performer>) => void
  applyToPost: (postId: string, performerId: string, message: string) => Application
  createReverseBid: (input: Omit<ReverseBid, 'id' | 'createdAt' | 'proposals'>) => ReverseBid
  addBidProposal: (bidId: string, proposal: BidProposal) => void

  /* 채팅 */
  ensureThread: (venueId: string, performerId: string) => string
  sendMessage: (threadId: string, from: Role, text: string) => void
  markThreadRead: (threadId: string) => void

  /* 데모 */
  setDemo: (patch: Partial<DemoState>) => void
  resetDemoScenario: () => void
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
