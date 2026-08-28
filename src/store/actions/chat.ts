import type { ChatMessage, ChatThread, Role } from '@/types'
import type { GetState, SetState } from '../types'

export function createChatActions(set: SetState, get: GetState) {
  return {
    /** 스레드가 없으면 만들고 id를 돌려줍니다 */
    ensureThread: (venueId: string, performerId: string): string => {
      const found = get().chatThreads.find(
        (t) => t.venueId === venueId && t.performerId === performerId,
      )
      if (found) return found.id
      const id = get().nextId('ct')
      const thread: ChatThread = {
        id,
        venueId,
        performerId,
        lastText: '대화를 시작했습니다.',
        lastAt: get().demoNowIso,
        unread: 0,
      }
      set((s) => ({ chatThreads: [thread, ...s.chatThreads] }))
      return id
    },

    sendMessage: (threadId: string, from: Role, text: string) => {
      const id = get().nextId('cm')
      const message: ChatMessage = { id, threadId, from, text, createdAt: get().demoNowIso }
      set((s) => ({
        chatMessages: [...s.chatMessages, message],
        chatThreads: s.chatThreads.map((t) =>
          t.id === threadId ? { ...t, lastText: text, lastAt: message.createdAt } : t,
        ),
      }))
    },

    markThreadRead: (threadId: string) =>
      set((s) => ({
        chatThreads: s.chatThreads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
      })),
  }
}
