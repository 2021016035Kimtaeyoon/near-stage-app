import { DEPOSIT_AMOUNT } from '@/config/brand'
import { hashSeed } from '@/lib/rng'
import type { Reservation, Review } from '@/types'
import type { GetState, SetState } from '../types'

/** 예약 코드 — 결정론적으로 만들어 QR 캔버스 시드로 사용 */
function makeCode(showId: string, seq: number): string {
  const h = hashSeed(`${showId}-${seq}`).toString(36).toUpperCase().slice(0, 4).padEnd(4, 'X')
  return `OMD-${showId.toUpperCase()}-${h}`
}

export function createAudienceActions(set: SetState, get: GetState) {
  return {
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
        depositPaid: DEPOSIT_AMOUNT * headcount,
        qrCode: makeCode(showId, get().seq),
        status: '예약',
        createdAt: get().demoNowIso,
      }
      set((s) => {
        const shows = s.shows.map((sh) =>
          sh.id === showId
            ? { ...sh, reservedCount: Math.min(sh.capacity, sh.reservedCount + headcount) }
            : sh,
        )
        const updated = shows.find((sh) => sh.id === showId)
        const gross = updated ? updated.ticketPrice * updated.reservedCount : 0
        return {
          reservations: [reservation, ...s.reservations],
          shows,
          // 예약이 늘면 해당 공연의 정산 예정액도 함께 갱신됩니다
          settlements: s.settlements.map((st) =>
            st.showId === showId && st.status === '정산대기'
              ? { ...st, gross, net: Math.max(0, gross - st.platformFee) }
              : st,
          ),
        }
      })

      const show = get().shows.find((s) => s.id === showId)
      if (show?.venueId) {
        get().pushNotification({
          role: 'owner',
          type: '예약',
          title: '새 예약이 들어왔습니다',
          body: `‘${show.title}’에 ${headcount}명이 예약했습니다. 예약금 ${DEPOSIT_AMOUNT * headcount}원 결제 완료.`,
          link: '/owner/dashboard',
        })
      }
      return reservation
    },

    cancelReservation: (reservationId: string) =>
      set((s) => {
        const target = s.reservations.find((r) => r.id === reservationId)
        if (!target) return {}
        return {
          reservations: s.reservations.map((r) =>
            r.id === reservationId ? { ...r, status: '취소' as const } : r,
          ),
          shows: s.shows.map((sh) =>
            sh.id === target.showId
              ? { ...sh, reservedCount: Math.max(0, sh.reservedCount - target.headcount) }
              : sh,
          ),
        }
      }),

    addReview: (input: Omit<Review, 'id' | 'createdAt'>) => {
      const id = get().nextId('rv')
      const review: Review = { ...input, id, createdAt: get().demoNowIso }
      set((s) => ({ reviews: [review, ...s.reviews] }))

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
