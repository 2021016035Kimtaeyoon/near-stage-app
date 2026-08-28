import { DEPOSIT_AMOUNT } from '@/config/brand'
import { kstIso } from '@/lib/datetime'
import type { Reservation } from '@/types'

/**
 * 관객의 기존 예약 2건.
 * (하나는 지난 공연 — 리뷰 작성 진입점, 하나는 오늘 밤 공연 — QR 티켓)
 */
export const SEED_RESERVATIONS: Reservation[] = [
  {
    id: 'rs1',
    showId: 's1',
    headcount: 2,
    depositPaid: DEPOSIT_AMOUNT * 2,
    qrCode: 'OMD-S1-2ZK9',
    status: '입장완료',
    createdAt: kstIso(2026, 9, 2, 14, 20),
  },
  {
    id: 'rs2',
    showId: 's10',
    headcount: 1,
    depositPaid: DEPOSIT_AMOUNT,
    qrCode: 'OMD-S10-7QW3',
    status: '예약',
    createdAt: kstIso(2026, 9, 5, 13, 5),
  },
]

/** 초기에 좋아요 눌러둔 공연 / 팔로우한 팀 */
export const SEED_LIKED_SHOW_IDS: string[] = ['s9', 's13', 'k3']
export const SEED_FOLLOWED_PERFORMER_IDS: string[] = ['p7', 'p14', 'p20']
