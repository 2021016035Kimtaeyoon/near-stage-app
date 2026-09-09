import { hmToMin, humanDateTime } from '@/lib/datetime'
import { toast } from '../useToast'
import type { Post, Show, TimeSlot, Venue, Weekday } from '@/types'
import type { AcceptResult, GetState, SetState } from '../types'

/** 런타임에 확정되는 공연의 기본 티켓 가격 */
const RUNTIME_TICKET_PRICE = 10_000

export function createOwnerActions(set: SetState, get: GetState) {
  return {
    updateVenue: (venueId: string, patch: Partial<Venue>) =>
      set((s) => ({
        venues: s.venues.map((v) => (v.id === venueId ? { ...v, ...patch } : v)),
      })),

    updateVenueEquipment: (venueId: string, patch: Partial<Venue['equipment']>) =>
      set((s) => ({
        venues: s.venues.map((v) =>
          v.id === venueId ? { ...v, equipment: { ...v.equipment, ...patch } } : v,
        ),
      })),

    /** 이미 공연이 확정된 슬롯은 닫을 수 없습니다. 성공하면 true */
    toggleSlotOpen: (venueId: string, slotId: string): boolean => {
      const venue = get().venues.find((v) => v.id === venueId)
      const slot = venue?.availableSlots.find((sl) => sl.id === slotId)
      if (!slot || slot.bookedShowId) return false
      set((s) => ({
        venues: s.venues.map((v) =>
          v.id === venueId
            ? {
                ...v,
                availableSlots: v.availableSlots.map((sl) =>
                  sl.id === slotId ? { ...sl, open: !sl.open } : sl,
                ),
              }
            : v,
        ),
      }))
      return true
    },

    addSlot: (venueId: string, slot: Omit<TimeSlot, 'id'>) => {
      const id = get().nextId('ts')
      set((s) => ({
        venues: s.venues.map((v) =>
          v.id === venueId ? { ...v, availableSlots: [...v.availableSlots, { ...slot, id }] } : v,
        ),
      }))
    },

    removeSlot: (venueId: string, slotId: string) =>
      set((s) => ({
        venues: s.venues.map((v) =>
          v.id === venueId
            ? {
                ...v,
                availableSlots: v.availableSlots.filter(
                  (sl) => sl.id !== slotId || sl.bookedShowId !== null,
                ),
              }
            : v,
        ),
      })),

    createPost: (input: Omit<Post, 'id' | 'createdAt' | 'applications' | 'closed'>): Post => {
      const id = get().nextId('po')
      const post: Post = { ...input, id, createdAt: new Date().toISOString(), applications: [], closed: false }
      set((s) => ({ posts: [post, ...s.posts] }))
      get().pushNotification({
        role: 'performer',
        type: '시스템',
        title: '조건에 맞는 새 구인글',
        body: `${get().venues.find((v) => v.id === input.venueId)?.name ?? '공간'}이(가) ${input.wantedGenres.join('·')} 아티스트를 찾고 있습니다.`,
        link: '/performer/posts',
      })
      return post
    },

    /** ★ 수락 → 공연 확정 → 관객 지도에 즉시 새 핀 생성 */
    acceptApplication: (
      postId: string,
      applicationId: string,
      startAt: string,
    ): AcceptResult | null => {
      const state = get()
      const post = state.posts.find((p) => p.id === postId)
      const application = post?.applications.find((a) => a.id === applicationId)
      if (!post || !application) return null
      if (application.status !== '대기') {
        toast('이미 처리된 지원입니다', 'warn')
        return null
      }
      const venue = state.venues.find((v) => v.id === post.venueId)
      const performer = state.performers.find((p) => p.id === application.performerId)
      if (!venue || !performer) return null

      const siblings = post.applications.filter(
        (a) => a.id !== applicationId && a.status === '대기',
      )

      const showId = state.nextId('sh')
      const show: Show = {
        id: showId,
        venueId: venue.id,
        performerId: performer.id,
        startAt,
        durationMin: performer.durationMin,
        title: `${performer.teamName} @ ${venue.name}`,
        ticketPrice: RUNTIME_TICKET_PRICE,
        capacity: venue.capacity,
        reservedCount: 0,
        likes: 0,
        status: '공연확정',
        source: 'own',
        tags: [performer.genre, '신규 매칭'],
        description: `${venue.name}에서 열리는 ${performer.teamName}의 ${performer.durationMin}분 공연입니다. ${performer.bio}`,
        genre: performer.genre,
      }

      const startDate = new Date(startAt)
      const weekday = startDate.getDay() as Weekday
      const startMin = startDate.getHours() * 60 + startDate.getMinutes()

      set((s) => ({
        shows: [...s.shows, show],
        posts: s.posts.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                closed: true,
                applications: p.applications.map((a) => {
                  if (a.id === applicationId) return { ...a, status: '수락' as const }
                  if (a.status === '대기') {
                    return { ...a, status: '거절' as const, rejectReason: '다른 지원자와 매칭되어 마감되었습니다' }
                  }
                  return a
                }),
              },
        ),
        venues: s.venues.map((v) =>
          v.id !== venue.id
            ? v
            : {
                ...v,
                monthlyShowCount: v.monthlyShowCount + 1,
                availableSlots: v.availableSlots.map((sl) =>
                  sl.weekday === weekday &&
                  hmToMin(sl.start) <= startMin &&
                  startMin < hmToMin(sl.end === '00:00' ? '24:00' : sl.end) &&
                  !sl.bookedShowId
                    ? { ...sl, bookedShowId: showId }
                    : sl,
                ),
              },
        ),
        highlightShowId: showId,
      }))

      // 알림 ①: 수락된 공연자
      get().pushNotification({
        role: 'performer',
        type: '수락',
        title: '지원이 수락되었습니다',
        body: `${venue.name}이(가) ${performer.teamName}의 지원을 수락했습니다. 공연이 확정되었어요.`,
        link: '/performer/activity',
      })
      // 알림 ②: 공간주 자신 — 확정 처리 완료 확인용
      get().pushNotification({
        role: 'owner',
        type: '확정',
        title: '공연이 확정되었습니다',
        body: `${performer.teamName} · ${humanDateTime(startAt, new Date().toISOString())}`,
        link: '/owner/dashboard',
      })
      // 알림 ③: 이 공연자를 팔로우하는 관객에게만 (전체 브로드캐스트 아님)
      if (get().followedPerformerIds.includes(performer.id)) {
        get().pushNotification({
          role: 'audience',
          type: '확정',
          title: `팔로우한 ${performer.teamName}의 공연이 확정됐어요`,
          body: `${venue.district} ${venue.name} · ${show.title}`,
          link: '/audience/home',
          audienceScope: 'followers',
          performerId: performer.id,
        })
      }
      // 같은 슬롯에 지원했던 다른 팀에게는 자동 거절을 알립니다
      for (const sibling of siblings) {
        const siblingPerformer = state.performers.find((p) => p.id === sibling.performerId)
        get().pushNotification({
          role: 'performer',
          type: '거절',
          title: '지원 결과 안내',
          body: `${siblingPerformer?.teamName ?? '팀'}의 지원이 마감되었습니다. 사유: 다른 지원자와 매칭되어 마감되었습니다`,
          link: '/performer/posts',
        })
      }
      // 채팅 스레드 자동 생성 — 공연자가 바로 대화를 이어갈 수 있게
      get().ensureThread(venue.id, performer.id)

      return { showId, startAt }
    },

    rejectApplication: (postId: string, applicationId: string, reason: string) => {
      const application = get()
        .posts.find((p) => p.id === postId)
        ?.applications.find((a) => a.id === applicationId)
      if (!application) return
      if (application.status !== '대기') {
        toast('이미 처리된 지원입니다', 'warn')
        return
      }
      const performerId = application.performerId
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                applications: p.applications.map((a) =>
                  a.id === applicationId
                    ? { ...a, status: '거절' as const, rejectReason: reason }
                    : a,
                ),
              },
        ),
      }))
      const performer = get().performers.find((p) => p.id === performerId)
      get().pushNotification({
        role: 'performer',
        type: '거절',
        title: '지원 결과 안내',
        body: `${performer?.teamName ?? '팀'}의 지원이 거절되었습니다. 사유: ${reason}`,
        link: '/performer/posts',
      })
    },

    /** 긴급 매칭 — 임시 구인글을 만들고 반경 내 공연자에게 발송합니다. 생성된 구인글 id 반환 */
    sendUrgentMatch: (venueId: string, message: string): string => {
      const venue = get().venues.find((v) => v.id === venueId)
      const post = get().createPost({
        venueId,
        wantedGenres: venue?.preferredGenres ?? [],
        dateRange: { from: new Date().toISOString(), to: new Date().toISOString() },
        offerFee: 0,
        message: `[긴급] ${message}`,
      })
      get().pushNotification({
        role: 'performer',
        type: '제안',
        title: '긴급 매칭 요청',
        body: `${venue?.name ?? '공간'}: ${message}`,
        link: '/performer/posts',
      })
      return post.id
    },

  }
}
