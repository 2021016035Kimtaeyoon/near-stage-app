import { kstIso } from '@/lib/datetime'
import type { Application, ApplicationStatus, Genre, Post, ReverseBid } from '@/types'

/** 구인글 6건 · 지원 14건 · 역경매 3건 */

const Y = 2026
const M = 9

interface AppSpec {
  performerId: string
  message: string
  status: ApplicationStatus
  day: number
  hh: number
  rejectReason?: string
}

interface PostSpec {
  id: string
  venueId: string
  wantedGenres: Genre[]
  from: number
  to: number
  offerFee: number
  message: string
  createdDay: number
  createdHh: number
  closed: boolean
  apps: AppSpec[]
}

const POSTS: PostSpec[] = [
  {
    id: 'po1',
    venueId: 'v1',
    wantedGenres: ['스탠드업', '싱어송라이터', '토론'],
    from: 9,
    to: 30,
    offerFee: 0,
    message:
      '평일 저녁 8시 이후가 계속 빕니다. 대여료 대신 그날 음료 매출의 25%를 드리고 있어요. 마이크 2개, 프로젝터 준비되어 있습니다.',
    createdDay: 3,
    createdHh: 14,
    closed: false,
    apps: [
      {
        performerId: 'p9',
        message: '오픈마이크 클럽입니다. 신인 코미디언 데뷔 무대로 매주 수요일 정기 진행 희망합니다.',
        status: '대기',
        day: 4,
        hh: 10,
      },
      {
        performerId: 'p1',
        message: '4인조 인디 록 밴드입니다. 앰프 소리는 최대한 줄여서 진행하겠습니다.',
        status: '대기',
        day: 4,
        hh: 16,
      },
      {
        performerId: 'p15',
        message: '통기타 하나로 40분 채웁니다. 앰프 없이도 가능해서 부담 없으실 거예요.',
        status: '대기',
        day: 5,
        hh: 11,
      },
    ],
  },
  {
    id: 'po2',
    venueId: 'v4',
    wantedGenres: ['밴드', 'DJ'],
    from: 8,
    to: 22,
    offerFee: 100000,
    message: '수요일과 금요일 밤 라인업을 채우고 있습니다. 드럼 세트는 저희 것 쓰시면 됩니다.',
    createdDay: 2,
    createdHh: 18,
    closed: false,
    apps: [
      {
        performerId: 'p4',
        message: '404 낫파운드입니다. 상수에서 단독 공연 마쳤고 관객 40명 모았습니다.',
        status: '대기',
        day: 3,
        hh: 9,
      },
      {
        performerId: 'p5',
        message: '브라스 5인조입니다. 전원 7kW 필요한데 확인 부탁드립니다.',
        status: '대기',
        day: 3,
        hh: 21,
      },
      {
        performerId: 'p3',
        message: '로파이 3인조입니다. 조용한 세트도 가능합니다.',
        status: '거절',
        day: 2,
        hh: 22,
        rejectReason: '원하는 장르와 맞지 않아요',
      },
    ],
  },
  {
    id: 'po3',
    venueId: 'v10',
    wantedGenres: ['토론', '스탠드업'],
    from: 10,
    to: 24,
    offerFee: 50000,
    message: '북토크 손님들이 토론 프로그램을 계속 물어보십니다. 격주 목요일로 정기화하고 싶어요.',
    createdDay: 1,
    createdHh: 15,
    closed: false,
    apps: [
      {
        performerId: 'p17',
        message: '말싸움연구소입니다. 격주 목요일 90분 진행 가능합니다.',
        status: '수락',
        day: 2,
        hh: 11,
      },
      {
        performerId: 'p8',
        message: '솔로 스탠드업 40분입니다. 토론 사이 쉬는 시간 코너로도 가능합니다.',
        status: '대기',
        day: 4,
        hh: 13,
      },
    ],
  },
  {
    id: 'po4',
    venueId: 'v16',
    wantedGenres: ['밴드', '싱어송라이터'],
    from: 9,
    to: 23,
    offerFee: 0,
    message: '성수에서 평일 저녁이 가장 한가합니다. 대여료는 없고 음료 매출 20% 배분입니다.',
    createdDay: 3,
    createdHh: 20,
    closed: false,
    apps: [
      {
        performerId: 'p6',
        message: '삼거리 청년들입니다. 매출 배분형 환영합니다.',
        status: '수락',
        day: 4,
        hh: 8,
      },
      {
        performerId: 'p16',
        message: '보컬·기타 듀오입니다. 저녁 시간대 잔잔한 세트로 준비하겠습니다.',
        status: '대기',
        day: 4,
        hh: 19,
      },
    ],
  },
  {
    id: 'po5',
    venueId: 'v12',
    wantedGenres: ['마술', '국악'],
    from: 12,
    to: 26,
    offerFee: 60000,
    message: '식사 손님 테이블을 도는 형태를 선호합니다. 무대는 따로 없습니다.',
    createdDay: 2,
    createdHh: 12,
    closed: false,
    apps: [
      {
        performerId: 'p10',
        message: '클로즈업 매직 전문입니다. 무대 없이 테이블만 있으면 됩니다.',
        status: '수락',
        day: 2,
        hh: 20,
      },
      {
        performerId: 'p19',
        message: '해금 3인조입니다. 앰프 없이 어쿠스틱으로도 진행 가능합니다.',
        status: '대기',
        day: 3,
        hh: 17,
      },
    ],
  },
  {
    id: 'po6',
    venueId: 'v6',
    wantedGenres: ['싱어송라이터', '국악'],
    from: 11,
    to: 25,
    offerFee: 40000,
    message: '앰프는 어렵습니다. 목소리와 어쿠스틱 악기 위주로 부탁드려요.',
    createdDay: 4,
    createdHh: 11,
    closed: false,
    apps: [
      {
        performerId: 'p15',
        message: '앰프 없이 진행 가능합니다. 식사 시간대에 잘 맞을 것 같아요.',
        status: '대기',
        day: 4,
        hh: 22,
      },
      {
        performerId: 'p19',
        message: '해금 산조와 대중가요 메들리로 구성하겠습니다.',
        status: '대기',
        day: 5,
        hh: 9,
      },
    ],
  },
]

let appSeq = 0
export const SEED_POSTS: Post[] = POSTS.map((p) => {
  const applications: Application[] = p.apps.map((a) => {
    appSeq += 1
    return {
      id: `ap${appSeq}`,
      postId: p.id,
      performerId: a.performerId,
      message: a.message,
      status: a.status,
      createdAt: kstIso(Y, M, a.day, a.hh, 0),
      ...(a.rejectReason ? { rejectReason: a.rejectReason } : {}),
    }
  })
  return {
    id: p.id,
    venueId: p.venueId,
    wantedGenres: p.wantedGenres,
    dateRange: { from: kstIso(Y, M, p.from, 0, 0), to: kstIso(Y, M, p.to, 23, 59) },
    offerFee: p.offerFee,
    message: p.message,
    createdAt: kstIso(Y, M, p.createdDay, p.createdHh, 0),
    applications,
    closed: p.closed,
  }
})

export const SEED_REVERSE_BIDS: ReverseBid[] = [
  {
    id: 'rb1',
    performerId: 'p7',
    wantedRegion: '연남·홍대',
    wantedDates: [kstIso(Y, M, 10, 20, 0), kstIso(Y, M, 17, 20, 0), kstIso(Y, M, 24, 20, 0)],
    minFee: 80000,
    message: '3인 스탠드업 60분. 관객 20명 규모면 충분합니다. 마이크 2개만 있으면 돼요.',
    createdAt: kstIso(Y, M, 3, 13, 0),
    proposals: [
      {
        venueId: 'v10',
        fee: 90000,
        message: '합정 카페 릴레이입니다. 목요일 저녁 어떠세요? 마이크 2개 상시 대기입니다.',
        createdAt: kstIso(Y, M, 3, 18, 0),
      },
      {
        venueId: 'v14',
        fee: 80000,
        message: '홍대 카페 언플러그드입니다. 수요일 저녁 슬롯 비어 있습니다.',
        createdAt: kstIso(Y, M, 4, 10, 0),
      },
    ],
  },
  {
    id: 'rb2',
    performerId: 'p14',
    wantedRegion: '마포구 전역',
    wantedDates: [kstIso(Y, M, 12, 20, 0), kstIso(Y, M, 19, 20, 0)],
    minFee: 70000,
    message: '피아노가 있는 공간을 찾습니다. 업라이트도 괜찮습니다.',
    createdAt: kstIso(Y, M, 2, 16, 0),
    proposals: [
      {
        venueId: 'v2',
        fee: 100000,
        message: '연남 살롱 드 밤입니다. 업라이트 피아노 조율 막 마쳤습니다.',
        createdAt: kstIso(Y, M, 2, 22, 0),
      },
    ],
  },
  {
    id: 'rb3',
    performerId: 'p20',
    wantedRegion: '홍대·성수',
    wantedDates: [kstIso(Y, M, 11, 22, 0), kstIso(Y, M, 18, 22, 0)],
    minFee: 180000,
    message: '2시간 디스코·하우스 세트. CDJ 없으면 컨트롤러 들고 갑니다.',
    createdAt: kstIso(Y, M, 4, 15, 0),
    proposals: [
      {
        venueId: 'v8',
        fee: 200000,
        message: '연남 라운지 909입니다. 금요일 심야 슬롯으로 모시고 싶습니다.',
        createdAt: kstIso(Y, M, 4, 20, 0),
      },
      {
        venueId: 'v15',
        fee: 220000,
        message: '성수 창고 스페이스45입니다. 500명 규모 창고 파티 기획 중입니다.',
        createdAt: kstIso(Y, M, 5, 12, 0),
      },
    ],
  },
]
