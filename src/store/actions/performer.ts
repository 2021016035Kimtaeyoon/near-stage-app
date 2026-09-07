import type { Application, BidProposal, Performer, ReverseBid } from '@/types'
import type { GetState, SetState } from '../types'

export function createPerformerActions(set: SetState, get: GetState) {
  return {
    updatePerformer: (performerId: string, patch: Partial<Performer>) =>
      set((s) => ({
        performers: s.performers.map((p) => (p.id === performerId ? { ...p, ...patch } : p)),
      })),

    applyToPost: (postId: string, performerId: string, message: string): Application => {
      const id = get().nextId('ap')
      const application: Application = {
        id,
        postId,
        performerId,
        message,
        status: '대기',
        createdAt: new Date().toISOString(),
      }
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === postId ? { ...p, applications: [...p.applications, application] } : p,
        ),
      }))

      const post = get().posts.find((p) => p.id === postId)
      const performer = get().performers.find((p) => p.id === performerId)
      const venue = get().venues.find((v) => v.id === post?.venueId)
      get().pushNotification({
        role: 'owner',
        type: '지원',
        title: '새 지원자가 있습니다',
        body: `${performer?.teamName ?? '공연팀'}이(가) ${venue?.name ?? '공간'} 구인글에 지원했습니다.`,
        link: '/owner/recruit',
      })
      return application
    },

    createReverseBid: (input: Omit<ReverseBid, 'id' | 'createdAt' | 'proposals'>): ReverseBid => {
      const id = get().nextId('rb')
      const bid: ReverseBid = { ...input, id, createdAt: new Date().toISOString(), proposals: [] }
      set((s) => ({ reverseBids: [bid, ...s.reverseBids] }))
      return bid
    },

    addBidProposal: (bidId: string, proposal: BidProposal) => {
      set((s) => ({
        reverseBids: s.reverseBids.map((b) =>
          b.id === bidId ? { ...b, proposals: [...b.proposals, proposal] } : b,
        ),
      }))
      const venue = get().venues.find((v) => v.id === proposal.venueId)
      get().pushNotification({
        role: 'performer',
        type: '제안',
        title: '공간에서 제안이 도착했습니다',
        body: `${venue?.name ?? '공간'} · ${proposal.fee.toLocaleString('ko-KR')}원`,
        link: '/performer/posts',
      })
    },
  }
}
