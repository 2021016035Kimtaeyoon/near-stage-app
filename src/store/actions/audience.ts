import { toast } from '../useToast'
import type { AudienceFilter, Reservation, Review } from '@/types'
import type { GetState, SetState } from '../types'

/** 취소는 공연 시작 3시간 전까지만 가능합니다 */
const CANCEL_CUTOFF_MS = 3 * 60 * 60 * 1000

/** 평점 1건 추가 시 평균을 다시 계산합니다 (반올림 1자리) */
function recomputeRating(prevAvg: number, prevCount: number, added: number): number {
  return Math.round(((prevAvg * prevCount + added) / (prevCount + 1)) * 10) / 10
}

export function createAudienceActions(set: SetState, get: GetState) {
  return {
    setAudienceFilter: (patch: Partial<AudienceFilter>) =>
      set((s) => ({ audienceFilter: { ...s.audienceFilter, ...patch } })),

    toggleLike: (showId: string) =>
      set((s) => {
        const liked = s.likedShowIds.includes(showId)
        return {
          likedShowIds: liked
            ? s.likedShowIds.filter((id) => id !== showId)
            : [showId, ...s.likedShowIds],
          shows: s.shows.map((sh) =>
            sh.id === showId ? { ...sh, likes: sh.likes + (liked ? -1 : 1) } : sh,
          ),
        }
      }),

    addRecentlyViewedShow: (showId: string) =>
      set((s) => ({
        recentlyViewedShowIds: [showId, ...s.recentlyViewedShowIds.filter((id) => id !== showId)].slice(
          0,
          10,
        ),
      })),

    toggleFollow: (performerId: string) =>
      set((s) => {
        const followed = s.followedPerformerIds.includes(performerId)
        return {
          followedPerformerIds: followed
            ? s.followedPerformerIds.filter((id) => id !== performerId)
            : [performerId, ...s.followedPerformerIds],
          performers: s.performers.map((p) =>
            p.id === performerId
              ? { ...p, followerCount: p.followerCount + (followed ? -1 : 1) }
              : p,
          ),
        }
      }),

    createReservation: (showId: string, headcount: number): Reservation => {
      const id = get().nextId('rs')
      const reservation: Reservation = {
        id,
        showId,
        headcount,
        status: '예약',
        createdAt: new Date().toISOString(),
      }
      set((s) => {
        const shows = s.shows.map((sh) =>
          sh.id === showId
            ? { ...sh, reservedCount: Math.min(sh.capacity, sh.reservedCount + headcount) }
            : sh,
        )
        return { reservations: [reservation, ...s.reservations], shows }
      })

      const show = get().shows.find((s) => s.id === showId)
      if (show?.venueId) {
        get().pushNotification({
          role: 'owner',
          type: '예약',
          title: '참석 예정이 등록됐어요',
          body: `‘${show.title}’에 ${headcount}명이 온다고 알려왔습니다.`,
          link: '/owner/dashboard',
        })
      }
      return reservation
    },

    /** 성공하면 true. 이미 처리된 예약이거나 시작 3시간 이내면 취소를 막고 false를 반환합니다 */
    cancelReservation: (reservationId: string): boolean => {
      const state = get()
      const target = state.reservations.find((r) => r.id === reservationId)
      if (!target) return false
      if (target.status !== '예약') {
        toast('이미 처리된 예약입니다', 'warn')
        return false
      }
      const show = state.shows.find((sh) => sh.id === target.showId)
      if (show && new Date(show.startAt).getTime() - new Date(new Date().toISOString()).getTime() < CANCEL_CUTOFF_MS) {
        toast('공연 3시간 전부터는 취소할 수 없어요', 'warn', '스태프에게 문의해 주세요')
        return false
      }
      set((s) => ({
        reservations: s.reservations.map((r) =>
          r.id === reservationId ? { ...r, status: '취소' as const } : r,
        ),
        shows: s.shows.map((sh) =>
          sh.id === target.showId
            ? { ...sh, reservedCount: Math.max(0, sh.reservedCount - target.headcount) }
            : sh,
        ),
      }))
      if (show?.venueId) {
        get().pushNotification({
          role: 'owner',
          type: '예약',
          title: '참석 예정이 취소되었습니다',
          body: `‘${show.title}’ 예약 ${target.headcount}명이 취소되어 자리가 다시 열렸습니다.`,
          link: '/owner/dashboard',
        })
      }
      return true
    },

    /** 공간주가 QR을 스캔해 입장 처리합니다. 성공하면 true */
    checkInReservation: (reservationId: string): boolean => {
      const target = get().reservations.find((r) => r.id === reservationId)
      if (!target) return false
      if (target.status !== '예약') {
        toast(target.status === '입장완료' ? '이미 입장 처리된 티켓입니다' : '취소된 예약입니다', 'warn')
        return false
      }
      set((s) => ({
        reservations: s.reservations.map((r) =>
          r.id === reservationId ? { ...r, status: '입장완료' as const } : r,
        ),
      }))
      return true
    },

    addReview: (input: Omit<Review, 'id' | 'createdAt'>) => {
      const id = get().nextId('rv')
      const review: Review = { ...input, id, createdAt: new Date().toISOString() }
      set((s) => ({
        reviews: [review, ...s.reviews],
        venues:
          input.targetType === 'venue'
            ? s.venues.map((v) =>
                v.id === input.targetId
                  ? {
                      ...v,
                      rating: recomputeRating(v.rating, v.reviewCount, input.rating),
                      reviewCount: v.reviewCount + 1,
                    }
                  : v,
              )
            : s.venues,
        performers:
          input.targetType === 'performer'
            ? s.performers.map((p) =>
                p.id === input.targetId
                  ? {
                      ...p,
                      rating: recomputeRating(p.rating, p.reviewCount, input.rating),
                      reviewCount: p.reviewCount + 1,
                    }
                  : p,
              )
            : s.performers,
      }))

      if (input.targetType === 'venue') {
        get().pushNotification({
          role: 'owner',
          type: '리뷰',
          title: '공간 리뷰가 등록되었습니다',
          body: `‘${input.text.slice(0, 24)}…’ — 별점 ${input.rating}점`,
          link: '/owner/dashboard',
        })
      } else {
        get().pushNotification({
          role: 'performer',
          type: '리뷰',
          title: '공연 리뷰가 등록되었습니다',
          body: `‘${input.text.slice(0, 24)}…’ — 별점 ${input.rating}점`,
          link: '/performer/activity',
        })
      }
    },
  }
}
