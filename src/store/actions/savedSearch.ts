import {
  autoSavedSearchName,
  describeSavedFilter,
  sameSavedFilter,
  showMatchesSavedFilter,
  toSavedFilter,
} from '@/lib/savedSearch'
import { toast } from '../useToast'
import type { SavedSearch } from '@/types'
import type { GetState, SetState } from '../types'

export function createSavedSearchActions(set: SetState, get: GetState) {
  return {
    /**
     * 지금 화면의 필터를 관심 조건으로 저장합니다.
     * 이미 같은 조건이 있으면 새로 만들지 않고 그것을 돌려줍니다 — 필터를 만질 때마다
     * 저장 버튼을 누르는 흐름이라 중복이 쉽게 쌓이기 때문입니다.
     */
    saveCurrentSearch: (name?: string): SavedSearch => {
      const state = get()
      const filter = toSavedFilter(state.audienceFilter)

      const existing = state.savedSearches.find((x) => sameSavedFilter(x.filter, filter))
      if (existing) {
        toast('이미 저장한 조건이에요', 'warn', existing.name)
        return existing
      }

      const search: SavedSearch = {
        id: state.nextId('ss'),
        name: name?.trim() || autoSavedSearchName(filter),
        filter,
        alertOn: true,
        createdAt: state.demoNowIso,
        notifiedShowIds: [],
      }
      set((s) => ({ savedSearches: [search, ...s.savedSearches] }))
      toast('관심 조건을 저장했어요', 'success', `${search.name} · 조건에 맞는 새 공연이 열리면 알려드려요`)
      return search
    },

    removeSavedSearch: (id: string) =>
      set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),

    toggleSavedSearchAlert: (id: string) =>
      set((s) => ({
        savedSearches: s.savedSearches.map((x) =>
          x.id === id ? { ...x, alertOn: !x.alertOn } : x,
        ),
      })),

    renameSavedSearch: (id: string, name: string) =>
      set((s) => ({
        savedSearches: s.savedSearches.map((x) =>
          x.id === id ? { ...x, name: name.trim() || autoSavedSearchName(x.filter) } : x,
        ),
      })),

    /** 저장해 둔 조건을 화면 필터에 다시 얹습니다 (검색어는 지웁니다) */
    applySavedSearch: (id: string) => {
      const found = get().savedSearches.find((x) => x.id === id)
      if (!found) return
      set((s) => ({ audienceFilter: { ...s.audienceFilter, ...found.filter, query: '' } }))
    },

    /**
     * 새 공연이 열렸을 때 호출합니다. 알림을 켜 둔 관심 조건과 대조해 걸리는 게 있으면
     * 관객 알림을 1건 발송합니다. 여러 조건에 동시에 걸려도 알림은 1건입니다 —
     * 같은 공연으로 알림함이 도배되면 오히려 안 보게 되니까요.
     */
    notifySavedSearchMatches: (showId: string) => {
      const state = get()
      const show = state.shows.find((sh) => sh.id === showId)
      if (!show) return

      const hits = state.savedSearches.filter(
        (ss) =>
          ss.alertOn &&
          !ss.notifiedShowIds.includes(showId) &&
          showMatchesSavedFilter(ss.filter, show, state.venues, state.demoNowIso),
      )
      if (hits.length === 0) return

      const hitIds = new Set(hits.map((h) => h.id))
      set((s) => ({
        savedSearches: s.savedSearches.map((ss) =>
          hitIds.has(ss.id) ? { ...ss, notifiedShowIds: [showId, ...ss.notifiedShowIds] } : ss,
        ),
      }))

      const lead = hits[0]
      get().pushNotification({
        role: 'audience',
        type: '관심',
        title: '관심 조건에 맞는 공연이 열렸어요',
        // 공간 이름이 뒤에 오면 조사가 어색해지므로 조건과 공연을 줄로 나눠 씁니다
        body: `‘${lead.name}’ 조건에 새 공연이 걸렸습니다. ${show.title} · ${describeSavedFilter(lead.filter)}`,
        link: '/audience/home',
      })
    },
  }
}
