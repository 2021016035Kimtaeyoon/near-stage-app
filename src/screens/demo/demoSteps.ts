import { DEMO_AUDIENCE_NAME, DEMO_OWNER_VENUE_ID, DEMO_PERFORMER_ID } from '@/config/brand'
import { useAppStore } from '@/store/useAppStore'

/** 단계 사이에서 넘겨야 하는 값(구인글/공연/예약 id) — 실행 중에 채워집니다 */
export interface DemoCtx {
  postId: string | null
  applicationId: string | null
  showId: string | null
  reservationId: string | null
}

export function createDemoCtx(): DemoCtx {
  return { postId: null, applicationId: null, showId: null, reservationId: null }
}

export interface DemoStep {
  title: string
  caption: string
  role: '공간주' | '공연자' | '시스템' | '관객'
  /** ctx를 참고해 이동할 경로를 계산합니다 */
  path: (ctx: DemoCtx) => string
  /** 이 단계에 들어올 때 한 번 실행되는 실제 상태 변화 */
  run: (ctx: DemoCtx) => void
}

const VENUE_ID = DEMO_OWNER_VENUE_ID
const PERFORMER_ID = DEMO_PERFORMER_ID

export const DEMO_STEPS: DemoStep[] = [
  {
    title: '구인글 작성',
    role: '공간주',
    caption: "연남동 '카페 온화'가 수요일 저녁 슬롯을 열고 구인글을 작성합니다",
    path: () => '/owner/recruit',
    run: (ctx) => {
      const store = useAppStore.getState()
      store.setRole('owner')
      const post = store.createPost({
        venueId: VENUE_ID,
        wantedGenres: ['스탠드업'],
        dateRange: { from: store.demoNowIso, to: store.demoNowIso },
        offerFee: 80000,
        message: '수요일 저녁 8시 슬롯이 비었어요! 스탠드업 코미디 팀을 찾습니다. 마이크 2개 준비되어 있어요.',
      })
      ctx.postId = post.id
    },
  },
  {
    title: '구인글 지원',
    role: '공연자',
    caption: "스탠드업 팀 '실없는사람들'이 구인글을 발견하고 지원합니다",
    path: () => '/performer/posts',
    run: (ctx) => {
      const store = useAppStore.getState()
      store.setRole('performer')
      if (!ctx.postId) return
      const application = store.applyToPost(
        ctx.postId,
        PERFORMER_ID,
        '저희 실없는사람들입니다! 수요일 저녁 시간 딱 좋습니다. 지금 바로 갈 수 있어요.',
      )
      ctx.applicationId = application.id
    },
  },
  {
    title: '지원자 수락',
    role: '공간주',
    caption: '장비 조건 충족을 확인하고, 매칭 수수료 10,000원을 결제해 공연을 확정합니다',
    path: (ctx) => (ctx.postId ? `/owner/applicants/${ctx.postId}` : '/owner/recruit'),
    run: (ctx) => {
      const store = useAppStore.getState()
      store.setRole('owner')
      if (!ctx.postId || !ctx.applicationId) return
      const now = new Date(store.demoNowIso)
      now.setHours(20, 0, 0, 0)
      const result = store.acceptApplication(ctx.postId, ctx.applicationId, now.toISOString())
      ctx.showId = result?.showId ?? null
    },
  },
  {
    title: '지도에 반영',
    role: '시스템',
    caption: '공연이 확정되어 관객 지도에 새 핀이 팝업 애니메이션과 함께 생성됩니다',
    path: () => '/audience/home',
    run: () => {
      useAppStore.getState().setRole('audience')
    },
  },
  {
    title: '공연 발견',
    role: '관객',
    caption: "관객이 '오늘 밤 · 2km' 필터에서 새 공연을 발견하고 상세 화면으로 들어갑니다",
    path: (ctx) => (ctx.showId ? `/audience/show/${ctx.showId}` : '/audience/home'),
    run: () => {
      useAppStore.getState().setRole('audience')
    },
  },
  {
    title: '예약 · QR 발급',
    role: '관객',
    caption: '예약금 1,000원을 결제하고 QR 티켓을 발급받습니다',
    path: (ctx) => (ctx.reservationId ? `/audience/ticket/${ctx.reservationId}` : '/audience/home'),
    run: (ctx) => {
      const store = useAppStore.getState()
      if (!ctx.showId) return
      const reservation = store.createReservation(ctx.showId, 1)
      ctx.reservationId = reservation.id
    },
  },
  {
    title: '대시보드 확인',
    role: '공간주',
    caption: '대시보드에서 예약 관객 수 증가와 성과 리포트 갱신을 확인합니다',
    path: () => '/owner/dashboard',
    run: () => {
      useAppStore.getState().setRole('owner')
    },
  },
  {
    title: '분리 리뷰 작성',
    role: '관객',
    caption: '공연이 끝난 뒤, 공간 리뷰와 공연 리뷰를 각각 따로 남깁니다',
    path: (ctx) => (ctx.showId ? `/audience/show/${ctx.showId}` : '/audience/home'),
    run: (ctx) => {
      const store = useAppStore.getState()
      store.setRole('audience')
      if (!ctx.showId) return
      const show = store.shows.find((s) => s.id === ctx.showId)
      if (!show?.venueId || !show.performerId) return
      store.addReview({
        showId: show.id,
        targetType: 'venue',
        targetId: show.venueId,
        rating: 5,
        text: '카페 분위기가 아늑해서 스탠드업 보기 딱 좋았어요.',
        authorName: DEMO_AUDIENCE_NAME,
      })
      store.addReview({
        showId: show.id,
        targetType: 'performer',
        targetId: show.performerId,
        rating: 5,
        text: '진짜 웃겨서 배 아팠어요. 다음에 또 보러 올게요!',
        authorName: DEMO_AUDIENCE_NAME,
      })
    },
  },
]
