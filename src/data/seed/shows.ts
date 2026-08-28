import { DEMO_NOW_ISO } from '@/config/brand'
import { kstIso } from '@/lib/datetime'
import { makeRng, rngInt } from '@/lib/rng'
import type { Genre, KopisVenueInfo, Show, ShowStatus } from '@/types'
import { SEED_PERFORMERS } from './performers'
import { SEED_VENUES } from './venues'

/**
 * 공연 34건 = 우리 무대(own) 22 + 등록 공연(kopis) 12.
 * 기준 시각(DEMO_NOW) 전후 3일(2026-09-02 ~ 09-08)에 분포하며,
 * "오늘 밤"(09-05 저녁)에 16건이 몰려 있습니다.
 */

const Y = 2026
const M = 9

function statusFor(startIso: string, durationMin: number): ShowStatus {
  const now = new Date(DEMO_NOW_ISO).getTime()
  const start = new Date(startIso).getTime()
  const end = start + durationMin * 60_000
  if (now >= end) return '종료'
  if (now >= start) return '진행중'
  return '공연확정'
}

/* ───────────────── 우리 무대 22건 ───────────────── */

interface OwnSpec {
  id: string
  venueId: string
  performerId: string
  day: number
  hh: number
  mm: number
  title: string
  price: number
  tags: string[]
  description: string
}

const OWN: OwnSpec[] = [
  // ── 지난 공연 (09/02 ~ 09/04) ──
  {
    id: 's1',
    venueId: 'v1',
    performerId: 'p7',
    day: 2,
    hh: 20,
    mm: 0,
    title: '수요일의 실없는 농담',
    price: 0,
    tags: ['첫 방문 환영', '무료'],
    description: '카페 온화의 수요일 정기 스탠드업. 커피 한 잔이면 입장입니다.',
  },
  {
    id: 's2',
    venueId: 'v4',
    performerId: 'p1',
    day: 2,
    hh: 20,
    mm: 30,
    title: '맥주와 소음 vol.7',
    price: 10000,
    tags: ['맥주 1잔 포함', '스탠딩'],
    description: '브루잉 연남의 수요 라이브. 티켓에 하우스 에일 한 잔이 포함됩니다.',
  },
  {
    id: 's3',
    venueId: 'v14',
    performerId: 'p14',
    day: 4,
    hh: 19,
    mm: 30,
    title: '금요일 밤, 피아노 한 대',
    price: 8000,
    tags: ['어쿠스틱', '착석'],
    description: '유하린의 피아노 자작곡 셋. 28석 소규모 공연입니다.',
  },
  {
    id: 's4',
    venueId: 'v2',
    performerId: 'p16',
    day: 3,
    hh: 20,
    mm: 30,
    title: '초저녁의 살롱',
    price: 10000,
    tags: ['칵테일 1잔', '듀오'],
    description: '연남 살롱 드 밤에서 열리는 목요 어쿠스틱 듀오 무대.',
  },
  {
    id: 's5',
    venueId: 'v10',
    performerId: 'p17',
    day: 3,
    hh: 19,
    mm: 30,
    title: '이번 주 말싸움: 사무실 단톡방',
    price: 5000,
    tags: ['관객 참여', '토론'],
    description: '주제 하나를 놓고 찬반으로 갈라 90분을 싸웁니다. 관객 투표로 승부를 정합니다.',
  },
  {
    id: 's6',
    venueId: 'v12',
    performerId: 'p10',
    day: 4,
    hh: 19,
    mm: 30,
    title: '테이블 매직 디너',
    price: 0,
    tags: ['식사 별도', '테이블 매직'],
    description: '식사하는 테이블을 돌며 진행하는 클로즈업 매직. 관람료는 무료입니다.',
  },
  {
    id: 's7',
    venueId: 'v9',
    performerId: 'p4',
    day: 4,
    hh: 20,
    mm: 0,
    title: '404 낫파운드 단독 라이브',
    price: 15000,
    tags: ['스탠딩', '단독'],
    description: '상수 언더그라운드에서 열리는 404 낫파운드의 첫 단독 공연.',
  },

  // ── 오늘 밤 (09/05) 11건 ──
  {
    id: 's8',
    venueId: 'v7',
    performerId: 'p15',
    day: 5,
    hh: 19,
    mm: 0,
    title: '마당에서 부르는 노래',
    price: 0,
    tags: ['무료', '야외', '어쿠스틱'],
    description: '카페 마당 뒷마당에서 열리는 통기타 무대. 음료 주문하시면 됩니다.',
  },
  {
    id: 's9',
    venueId: 'v1',
    performerId: 'p8',
    day: 5,
    hh: 19,
    mm: 30,
    title: '농담수집가 솔로쇼',
    price: 5000,
    tags: ['스탠드업', '관객 참여'],
    description: '혼자 40분을 채우는 솔로 스탠드업. 앞자리는 각오하고 앉으세요.',
  },
  {
    id: 's10',
    venueId: 'v5',
    performerId: 'p19',
    day: 5,
    hh: 19,
    mm: 30,
    title: '해금, 골목을 건너다',
    price: 12000,
    tags: ['국악', '크로스오버', '착석'],
    description: '해금과 장구, 기타가 만나는 크로스오버 무대. 대중가요 메들리 포함.',
  },
  {
    id: 's11',
    venueId: 'v2',
    performerId: 'p14',
    day: 5,
    hh: 20,
    mm: 0,
    title: '살롱 피아노 나이트',
    price: 10000,
    tags: ['피아노', '칵테일 1잔'],
    description: '살롱 드 밤의 업라이트 피아노로 듣는 유하린의 밤.',
  },
  {
    id: 's12',
    venueId: 'v11',
    performerId: 'p11',
    day: 5,
    hh: 20,
    mm: 0,
    title: '환상열차 - 실루엣',
    price: 12000,
    tags: ['마술', '20석 한정'],
    description: '블랙박스 공간에서 조명 연출과 함께하는 2인 무대 마술.',
  },
  {
    id: 's13',
    venueId: 'v4',
    performerId: 'p5',
    day: 5,
    hh: 20,
    mm: 30,
    title: '해질녘 브라스 파티',
    price: 12000,
    tags: ['브라스', '스탠딩', '맥주 1잔'],
    description: '5인조 브라스 밴드. 가만히 서 있기 힘든 60분.',
  },
  {
    id: 's14',
    venueId: 'v9',
    performerId: 'p1',
    day: 5,
    hh: 20,
    mm: 30,
    title: '월요일의 소음 - 토요일 편',
    price: 15000,
    tags: ['인디록', '스탠딩'],
    description: '상수 언더그라운드의 토요일 헤드라이너.',
  },
  {
    id: 's15',
    venueId: 'v16',
    performerId: 'p6',
    day: 5,
    hh: 20,
    mm: 30,
    title: '벽돌벽 어쿠스틱',
    price: 0,
    tags: ['무료', '성수', '어쿠스틱'],
    description: '성수 바 브릭에서 열리는 무료 어쿠스틱 나이트. 주문은 별도입니다.',
  },
  {
    id: 's16',
    venueId: 'v13',
    performerId: 'p9',
    day: 5,
    hh: 21,
    mm: 0,
    title: '오픈마이크 클럽 9월 정기',
    price: 12000,
    tags: ['스탠드업', '신인 데뷔'],
    description: '5명이 15분씩. 오늘 처음 무대에 서는 신인도 두 명 있습니다.',
  },
  {
    id: 's17',
    venueId: 'v15',
    performerId: 'p18',
    day: 5,
    hh: 21,
    mm: 0,
    title: '혼자 온 사람들의 밤',
    price: 15000,
    tags: ['솔로파티', '1인 참가만'],
    description: '혼자 오신 분만 입장 가능합니다. 진행자가 어색함을 책임집니다.',
  },
  {
    id: 's18',
    venueId: 'v8',
    performerId: 'p20',
    day: 5,
    hh: 22,
    mm: 0,
    title: 'DJ 하울 - 라운지 세트',
    price: 10000,
    tags: ['디스코', '하우스', '심야'],
    description: '연남 라운지 909의 심야 2시간 세트.',
  },

  // ── 이후 (09/06, 09/08) 4건 ──
  {
    id: 's19',
    venueId: 'v3',
    performerId: 'p13',
    day: 6,
    hh: 15,
    mm: 0,
    title: '일요일 낭독극 - 편지',
    price: 8000,
    tags: ['낭독극', '25석'],
    description: '무대 장치 없이 대본만으로 진행하는 낭독극과 관객과의 대화.',
  },
  {
    id: 's20',
    venueId: 'v10',
    performerId: 'p17',
    day: 6,
    hh: 16,
    mm: 0,
    title: '일요일 말싸움: 결혼식 축의금',
    price: 5000,
    tags: ['토론', '관객 투표'],
    description: '축의금 액수는 누가 정하는가. 90분간 진지하게 싸웁니다.',
  },
  {
    id: 's21',
    venueId: 'v13',
    performerId: 'p12',
    day: 6,
    hh: 18,
    mm: 0,
    title: '극단 셋째주 - 이사',
    price: 15000,
    tags: ['연극', '2인극'],
    description: '이사를 앞둔 두 사람의 70분. 커튼콜 후 배우와의 대화가 있습니다.',
  },
  {
    id: 's22',
    venueId: 'v12',
    performerId: 'p10',
    day: 8,
    hh: 19,
    mm: 0,
    title: '화요일 매직 디너',
    price: 10000,
    tags: ['클로즈업 매직', '식사 별도'],
    description: '합정 다이닝 온의 화요일 정기 테이블 매직.',
  },
]

/* ───────────────── 등록 공연(KOPIS) 12건 ───────────────── */

const KV: Record<string, KopisVenueInfo> = {
  kv1: {
    name: 'KT&G 상상마당 홍대',
    hall: '라이브홀',
    address: '서울 마포구 어울마당로 65',
    district: '서교동',
    lat: 37.5503,
    lng: 126.9224,
    capacity: 500,
  },
  kv2: {
    name: '롤링홀',
    hall: '메인홀',
    address: '서울 마포구 어울마당로 26',
    district: '서교동',
    lat: 37.5527,
    lng: 126.9225,
    capacity: 400,
  },
  kv3: {
    name: '마포아트센터',
    hall: '아트홀 맥',
    address: '서울 마포구 대흥로 20',
    district: '대흥동',
    lat: 37.5497,
    lng: 126.9441,
    capacity: 700,
  },
  kv4: {
    name: '서강대학교 메리홀',
    hall: '대극장',
    address: '서울 마포구 백범로 35',
    district: '대흥동',
    lat: 37.5513,
    lng: 126.941,
    capacity: 600,
  },
  kv5: {
    name: '파랑고래',
    hall: '공연장',
    address: '서울 서대문구 신촌역로 22',
    district: '창천동',
    lat: 37.558,
    lng: 126.937,
    capacity: 200,
  },
  kv6: {
    name: '아트원씨어터',
    hall: '2관',
    address: '서울 종로구 대학로 57',
    district: '동숭동',
    lat: 37.5822,
    lng: 127.0025,
    capacity: 300,
  },
  kv7: {
    name: '세종문화회관',
    hall: 'M씨어터',
    address: '서울 종로구 세종대로 175',
    district: '세종로',
    lat: 37.5725,
    lng: 126.9757,
    capacity: 600,
  },
  kv8: {
    name: '블루스퀘어',
    hall: '신한카드홀',
    address: '서울 용산구 이태원로 294',
    district: '한남동',
    lat: 37.5407,
    lng: 127.0027,
    capacity: 1400,
  },
}

interface KopisSpec {
  id: string
  kopisId: string
  venueKey: keyof typeof KV
  day: number
  hh: number
  mm: number
  durationMin: number
  title: string
  price: number
  genre: Genre
  genreLabel: string
  cast: string
  description: string
}

const KOPIS: KopisSpec[] = [
  {
    id: 'k1',
    kopisId: 'PF268401',
    venueKey: 'kv8',
    day: 5,
    hh: 19,
    mm: 30,
    durationMin: 150,
    title: '뮤지컬 <어쩌면 해피엔딩>',
    price: 70000,
    genre: '연극',
    genreLabel: '뮤지컬',
    cast: '정다현, 이서준 외',
    description: 'KOPIS 등록 공연 · 인터미션 20분 포함 150분',
  },
  {
    id: 'k2',
    kopisId: 'PF251177',
    venueKey: 'kv6',
    day: 5,
    hh: 20,
    mm: 0,
    durationMin: 110,
    title: '연극 <늘근 도둑 이야기>',
    price: 40000,
    genre: '연극',
    genreLabel: '연극',
    cast: '박상철, 김윤호',
    description: 'KOPIS 등록 공연 · 대학로 스테디셀러 코미디',
  },
  {
    id: 'k3',
    kopisId: 'PF272903',
    venueKey: 'kv1',
    day: 5,
    hh: 19,
    mm: 30,
    durationMin: 120,
    title: '상상마당 라이브: 가을 인디 위켄드',
    price: 44000,
    genre: '밴드',
    genreLabel: '대중음악',
    cast: '4팀 합동 공연',
    description: 'KOPIS 등록 공연 · 인디 밴드 4팀 합동 무대',
  },
  {
    id: 'k4',
    kopisId: 'PF270118',
    venueKey: 'kv2',
    day: 5,
    hh: 20,
    mm: 30,
    durationMin: 120,
    title: '롤링홀 새터데이 라이브',
    price: 38000,
    genre: '밴드',
    genreLabel: '대중음악',
    cast: '3팀 합동 공연',
    description: 'KOPIS 등록 공연 · 홍대 라이브홀 정기 공연',
  },
  {
    id: 'k5',
    kopisId: 'PF269540',
    venueKey: 'kv5',
    day: 5,
    hh: 19,
    mm: 0,
    durationMin: 90,
    title: '파랑고래 어쿠스틱 나잇',
    price: 33000,
    genre: '싱어송라이터',
    genreLabel: '대중음악',
    cast: '이하나, 정우석',
    description: 'KOPIS 등록 공연 · 200석 규모 어쿠스틱 무대',
  },
  {
    id: 'k6',
    kopisId: 'PF264822',
    venueKey: 'kv7',
    day: 6,
    hh: 15,
    mm: 0,
    durationMin: 160,
    title: '뮤지컬 <광화문에서>',
    price: 80000,
    genre: '연극',
    genreLabel: '뮤지컬',
    cast: '한지우, 오세훈 외',
    description: 'KOPIS 등록 공연 · 창작 뮤지컬 앙코르 공연',
  },
  {
    id: 'k7',
    kopisId: 'PF266310',
    venueKey: 'kv4',
    day: 6,
    hh: 16,
    mm: 0,
    durationMin: 100,
    title: '연극 <아버지의 방>',
    price: 35000,
    genre: '연극',
    genreLabel: '연극',
    cast: '극단 사각',
    description: 'KOPIS 등록 공연 · 가족극',
  },
  {
    id: 'k8',
    kopisId: 'PF262009',
    venueKey: 'kv3',
    day: 4,
    hh: 19,
    mm: 30,
    durationMin: 110,
    title: '2026 가을 실내악 시리즈 I',
    price: 50000,
    genre: '국악',
    genreLabel: '클래식',
    cast: '서울 체임버 앙상블',
    description: 'KOPIS 등록 공연 · 현악 4중주',
  },
  {
    id: 'k9',
    kopisId: 'PF273155',
    venueKey: 'kv7',
    day: 8,
    hh: 19,
    mm: 30,
    durationMin: 100,
    title: '국립정악단 가을 정기연주회',
    price: 30000,
    genre: '국악',
    genreLabel: '국악',
    cast: '국립정악단',
    description: 'KOPIS 등록 공연 · 정악 정기연주회',
  },
  {
    id: 'k10',
    kopisId: 'PF271002',
    venueKey: 'kv8',
    day: 7,
    hh: 19,
    mm: 30,
    durationMin: 145,
    title: '뮤지컬 <스물다섯, 스물하나>',
    price: 75000,
    genre: '연극',
    genreLabel: '뮤지컬',
    cast: '김세연, 문태호 외',
    description: 'KOPIS 등록 공연 · 라이선스 뮤지컬',
  },
  {
    id: 'k11',
    kopisId: 'PF259884',
    venueKey: 'kv3',
    day: 2,
    hh: 19,
    mm: 30,
    durationMin: 95,
    title: '마포 클래식 아카데미: 쇼팽의 밤',
    price: 45000,
    genre: '국악',
    genreLabel: '클래식',
    cast: '피아니스트 조민서',
    description: 'KOPIS 등록 공연 · 피아노 리사이틀',
  },
  {
    id: 'k12',
    kopisId: 'PF274460',
    venueKey: 'kv4',
    day: 8,
    hh: 20,
    mm: 0,
    durationMin: 80,
    title: '무브온 댄스컴퍼니 <궤적>',
    price: 36000,
    genre: '연극',
    genreLabel: '무용',
    cast: '무브온 댄스컴퍼니',
    description: 'KOPIS 등록 공연 · 현대무용',
  },
]

/* ───────────────── 조립 ───────────────── */

const venueById = new Map(SEED_VENUES.map((v) => [v.id, v]))
const performerById = new Map(SEED_PERFORMERS.map((p) => [p.id, p]))

const ownShows: Show[] = OWN.map((s) => {
  const venue = venueById.get(s.venueId)
  const performer = performerById.get(s.performerId)
  if (!venue || !performer) throw new Error(`seed: 잘못된 참조 ${s.id}`)
  const startAt = kstIso(Y, M, s.day, s.hh, s.mm)
  const rng = makeRng(`show-${s.id}`)
  const capacity = Math.max(12, venue.capacity - rngInt(rng, 0, 6))
  const status = statusFor(startAt, performer.durationMin)
  const fillRate = status === '종료' ? 0.72 : 0.4
  return {
    id: s.id,
    venueId: s.venueId,
    performerId: s.performerId,
    startAt,
    durationMin: performer.durationMin,
    title: s.title,
    ticketPrice: s.price,
    capacity,
    reservedCount: Math.min(capacity, Math.round(capacity * fillRate) + rngInt(rng, -3, 6)),
    likes: rngInt(rng, 12, 240),
    status,
    source: 'own',
    tags: s.tags,
    description: s.description,
    genre: performer.genre,
  }
})

const kopisShows: Show[] = KOPIS.map((s) => {
  const kv = KV[s.venueKey]
  const startAt = kstIso(Y, M, s.day, s.hh, s.mm)
  const rng = makeRng(`show-${s.id}`)
  const status = statusFor(startAt, s.durationMin)
  return {
    id: s.id,
    venueId: null,
    performerId: null,
    startAt,
    durationMin: s.durationMin,
    title: s.title,
    ticketPrice: s.price,
    capacity: kv.capacity,
    reservedCount: Math.round(kv.capacity * (0.55 + rngInt(rng, 0, 30) / 100)),
    likes: rngInt(rng, 40, 620),
    status,
    source: 'kopis',
    tags: [s.genreLabel, 'KOPIS 등록'],
    description: s.description,
    genre: s.genre,
    kopisId: s.kopisId,
    kopisVenue: kv,
    kopisCast: s.cast,
    kopisGenreLabel: s.genreLabel,
  }
})

export const SEED_SHOWS: Show[] = [...ownShows, ...kopisShows]
export const KOPIS_VENUE_INFO = KV
