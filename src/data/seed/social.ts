import { PLATFORM_FEE } from '@/config/brand'
import { kstIso } from '@/lib/datetime'
import type { AppNotification, ChatMessage, ChatThread, Settlement } from '@/types'
import { SEED_SHOWS } from './shows'

/** 알림 12건 · 채팅 4건 · 정산 8건 */

const Y = 2026
const M = 9

/* ───────────── 정산 8건 ───────────── */

const SETTLE_SHOW_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's9']
const showById = new Map(SEED_SHOWS.map((s) => [s.id, s]))

export const SEED_SETTLEMENTS: Settlement[] = SETTLE_SHOW_IDS.map((showId, i) => {
  const show = showById.get(showId)
  if (!show) throw new Error(`seed: 정산 대상 공연 없음 ${showId}`)
  const gross = show.ticketPrice * show.reservedCount
  const done = i < 5
  return {
    id: `st${i + 1}`,
    showId,
    gross,
    platformFee: PLATFORM_FEE,
    net: Math.max(0, gross - PLATFORM_FEE),
    status: done ? '정산완료' : '정산대기',
    settledAt: done ? kstIso(Y, M, 5, 10, 0) : null,
  }
})

/* ───────────── 채팅 4건 ───────────── */

interface ThreadSpec {
  id: string
  venueId: string
  performerId: string
  lines: Array<{ from: ChatMessage['from']; text: string; day: number; hh: number; mm: number }>
  unread: number
}

const THREADS: ThreadSpec[] = [
  {
    id: 'ct1',
    venueId: 'v1',
    performerId: 'p7',
    unread: 2,
    lines: [
      { from: 'performer', text: '안녕하세요! 실없는사람들입니다. 수요일 저녁 슬롯 아직 열려 있나요?', day: 4, hh: 15, mm: 12 },
      { from: 'owner', text: '네 열려 있습니다. 20시부터 22시까지 쓰실 수 있어요.', day: 4, hh: 15, mm: 40 },
      { from: 'performer', text: '마이크 2개랑 스탠드만 있으면 됩니다. 무대는 따로 없어도 괜찮아요.', day: 4, hh: 15, mm: 44 },
      { from: 'owner', text: '마이크 2개 있습니다. 프로젝터도 필요하시면 말씀 주세요.', day: 5, hh: 11, mm: 2 },
      { from: 'performer', text: '프로젝터는 안 써도 됩니다. 리허설 30분만 미리 가능할까요?', day: 5, hh: 11, mm: 20 },
    ],
  },
  {
    id: 'ct2',
    venueId: 'v4',
    performerId: 'p5',
    unread: 0,
    lines: [
      { from: 'performer', text: '해질녘 라디오입니다. 브라스 5인이라 전원 7kW가 필요한데 가능할까요?', day: 3, hh: 21, mm: 5 },
      { from: 'owner', text: '저희가 5kW라 조금 모자랍니다. 앰프 하나 줄이면 가능하실까요?', day: 3, hh: 21, mm: 30 },
      { from: 'performer', text: '가능합니다. 베이스 앰프를 DI로 대체하겠습니다.', day: 3, hh: 22, mm: 0 },
      { from: 'owner', text: '좋습니다. 그럼 오늘 밤 20시 30분으로 확정할게요.', day: 4, hh: 9, mm: 15 },
    ],
  },
  {
    id: 'ct3',
    venueId: 'v10',
    performerId: 'p8',
    unread: 1,
    lines: [
      { from: 'performer', text: '농담수집가입니다. 토론 사이 코너로도 설 수 있습니다.', day: 4, hh: 13, mm: 10 },
      { from: 'owner', text: '오 좋네요. 40분 통으로 하는 것도 검토해볼게요.', day: 4, hh: 18, mm: 22 },
      { from: 'performer', text: '편하신 쪽으로 맞추겠습니다. 일정만 주시면요!', day: 5, hh: 10, mm: 5 },
    ],
  },
  {
    id: 'ct4',
    venueId: 'v2',
    performerId: 'p14',
    unread: 0,
    lines: [
      { from: 'owner', text: '유하린님 안녕하세요. 역경매 보고 연락드립니다. 업라이트 피아노 조율 막 마쳤어요.', day: 2, hh: 22, mm: 3 },
      { from: 'performer', text: '와 정말요? 혹시 사진 한 장만 받아볼 수 있을까요?', day: 3, hh: 8, mm: 40 },
      { from: 'owner', text: '공간 사진에 올려뒀습니다. 오늘 밤 20시 슬롯 어떠세요?', day: 3, hh: 9, mm: 12 },
      { from: 'performer', text: '좋습니다! 그때로 부탁드려요.', day: 3, hh: 9, mm: 30 },
    ],
  },
]

const messages: ChatMessage[] = []
export const SEED_CHAT_THREADS: ChatThread[] = THREADS.map((t) => {
  t.lines.forEach((l, i) => {
    messages.push({
      id: `cm-${t.id}-${i + 1}`,
      threadId: t.id,
      from: l.from,
      text: l.text,
      createdAt: kstIso(Y, M, l.day, l.hh, l.mm),
    })
  })
  const last = t.lines[t.lines.length - 1]
  return {
    id: t.id,
    venueId: t.venueId,
    performerId: t.performerId,
    lastText: last.text,
    lastAt: kstIso(Y, M, last.day, last.hh, last.mm),
    unread: t.unread,
  }
})

export const SEED_CHAT_MESSAGES: ChatMessage[] = messages

/* ───────────── 알림 12건 ───────────── */

interface NotiSpec {
  role: AppNotification['role']
  type: AppNotification['type']
  title: string
  body: string
  day: number
  hh: number
  mm: number
  read: boolean
  link?: string
}

const NOTIS: NotiSpec[] = [
  {
    role: 'owner',
    type: '지원',
    title: '새 지원자 3명',
    body: '‘카페 온화 저녁 슬롯’ 구인글에 오픈마이크 클럽 외 2팀이 지원했습니다.',
    day: 5,
    hh: 11,
    mm: 5,
    read: false,
    link: '/owner/recruit',
  },
  {
    role: 'owner',
    type: '예약',
    title: '오늘 밤 공연 예약 18명',
    body: '‘농담수집가 솔로쇼’ 예약 인원이 18명이 되었습니다.',
    day: 5,
    hh: 17,
    mm: 40,
    read: false,
    link: '/owner/dashboard',
  },
  {
    role: 'owner',
    type: '정산',
    title: '정산 완료 3건',
    body: '지난주 공연 3건의 정산이 완료되었습니다. 총 입금액 384,000원.',
    day: 5,
    hh: 10,
    mm: 0,
    read: true,
    link: '/owner/settlement',
  },
  {
    role: 'owner',
    type: '리뷰',
    title: '공간 리뷰가 등록되었습니다',
    body: '‘카페인데 조명이 진짜 공연장 같았어요’ — 별점 5점',
    day: 4,
    hh: 22,
    mm: 12,
    read: true,
    link: '/owner/dashboard',
  },
  {
    role: 'performer',
    type: '제안',
    title: '역경매 제안 2건 도착',
    body: '합정 카페 릴레이, 홍대 카페 언플러그드가 조건을 제안했습니다.',
    day: 4,
    hh: 10,
    mm: 0,
    read: false,
    link: '/performer/posts',
  },
  {
    role: 'performer',
    type: '수락',
    title: '지원이 수락되었습니다',
    body: '합정 카페 릴레이가 말싸움연구소의 지원을 수락했습니다.',
    day: 2,
    hh: 12,
    mm: 30,
    read: true,
    link: '/performer/activity',
  },
  {
    role: 'performer',
    type: '리뷰',
    title: '관객 리뷰 5건',
    body: '지난 공연에 새 리뷰 5건이 달렸습니다. 평균 별점 4.7.',
    day: 5,
    hh: 9,
    mm: 20,
    read: false,
    link: '/performer/activity',
  },
  {
    role: 'performer',
    type: '정산',
    title: '정산 예정 안내',
    body: '9월 4일 공연 정산금이 다음 주 화요일에 입금됩니다.',
    day: 5,
    hh: 8,
    mm: 0,
    read: true,
    link: '/performer/activity',
  },
  {
    role: 'audience',
    type: '확정',
    title: '팔로우한 팀의 새 공연',
    body: '실없는사람들이 이번 주 연남동에서 공연합니다.',
    day: 5,
    hh: 12,
    mm: 0,
    read: false,
    link: '/audience/clips',
  },
  {
    role: 'audience',
    type: '예약',
    title: '오늘 밤 공연 리마인드',
    body: '예약하신 공연이 오늘 저녁에 있습니다. QR 티켓을 준비해 주세요.',
    day: 5,
    hh: 16,
    mm: 0,
    read: false,
    link: '/audience/my',
  },
  {
    role: 'audience',
    type: '시스템',
    title: '근처에 새 무대가 생겼어요',
    body: '연남동 반경 1km 안에 이번 주 공연 9건이 열립니다.',
    day: 5,
    hh: 13,
    mm: 30,
    read: true,
    link: '/audience/home',
  },
  {
    role: 'audience',
    type: '리뷰',
    title: '리뷰를 남겨주세요',
    body: '지난 공연은 어떠셨나요? 공간과 공연을 따로 평가할 수 있습니다.',
    day: 5,
    hh: 11,
    mm: 0,
    read: true,
    link: '/audience/my',
  },
]

export const SEED_NOTIFICATIONS: AppNotification[] = NOTIS.map((n, i) => ({
  id: `nt${i + 1}`,
  role: n.role,
  type: n.type,
  title: n.title,
  body: n.body,
  createdAt: kstIso(Y, M, n.day, n.hh, n.mm),
  read: n.read,
  ...(n.link ? { link: n.link } : {}),
}))
