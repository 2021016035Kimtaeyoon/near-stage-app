import { kstIso } from '@/lib/datetime'
import type { AppEvent } from '@/types'

/**
 * 진행 중인 이벤트 — 정적 프로모션 목록입니다(사용자 조작으로 바뀌지 않음).
 * ★ '단골 관객 등업 챌린지'는 회원등급(src/lib/membership.ts)과 실제로 맞물리는 유일한 항목이라,
 * 문구의 조건 숫자를 등급 임계값과 다르게 지어내지 않았습니다.
 */
export const EVENTS: AppEvent[] = [
  {
    id: 'ev1',
    tag: '신규',
    title: '첫 예약 예약금 100% 캐시백',
    description: '가입 후 첫 예약은 예약금 전액을 포인트로 돌려드려요.',
    endAt: kstIso(2026, 9, 30, 23, 59),
  },
  {
    id: 'ev2',
    tag: '등급',
    title: '단골 관객 등업 챌린지',
    description: '포인트를 100점 이상 모으면 단골 관객으로, 250점을 넘기면 VIP 관객으로 자동 승급돼요.',
  },
  {
    id: 'ev3',
    tag: '쿠폰',
    title: '공연 후기 남기고 30P 받기',
    description: '다녀온 공연에 후기를 남기면 회원등급 포인트가 즉시 적립됩니다.',
  },
  {
    id: 'ev4',
    tag: '기획전',
    title: '이번 주 무료 공연 위크',
    description: '예약금만으로 볼 수 있는 무료 공연을 홈 지도에서 모아봤어요.',
    endAt: kstIso(2026, 9, 12, 23, 59),
  },
  {
    id: 'ev5',
    tag: '쿠폰',
    title: '좋아요 5개 모으면 다음 예약금 면제',
    description: '관심 있는 공연에 좋아요를 누르기만 해도 포인트가 쌓여요.',
  },
]
