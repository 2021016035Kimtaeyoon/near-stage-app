import { kstIso } from '@/lib/datetime'
import type { SavedSearch } from '@/types'

/**
 * 관심 조건 2건.
 *
 * 관객이 "이런 공연 열리면 알려줘"라고 저장해 둔 필터입니다. 하나는 알림을 켜 둔 상태,
 * 하나는 꺼 둔 상태로 두어 목록에서 두 모양이 모두 보이게 했습니다.
 *
 * ss1은 자동 시연에서 확정되는 공연(연남동 카페 온화 · 스탠드업 · 우리 무대)과 일부러
 * 겹쳐 두었습니다. 시연을 끝까지 돌리면 '지원자 수락' 단계에서 관심 조건 알림이
 * 실제로 1건 발송됩니다.
 */
export const SEED_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'ss1',
    name: '걸어갈 수 있는 스탠드업',
    filter: { when: 'tonight', distance: 2, genres: ['스탠드업'], price: 'all', ownOnly: true },
    alertOn: true,
    createdAt: kstIso(2026, 9, 2, 21, 14),
    notifiedShowIds: [],
  },
  {
    id: 'ss2',
    name: '주말 무료 밴드 공연',
    filter: { when: 'weekend', distance: 5, genres: ['밴드'], price: 'free', ownOnly: false },
    alertOn: false,
    createdAt: kstIso(2026, 8, 29, 13, 40),
    notifiedShowIds: [],
  },
]
