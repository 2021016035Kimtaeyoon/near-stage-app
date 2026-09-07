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
        lastText: '아직 나눈 대화가 없어요',
        lastAt: new Date().toISOString(),
        unread: 0,
      }
      set((s) => ({ chatThreads: [thread, ...s.chatThreads] }))
      return id
    },

    sendMessage: (threadId: string, from: Role, text: string) => {
      const id = get().nextId('cm')
      const message: ChatMessage = { id, threadId, from, text, createdAt: new Date().toISOString() }
      set((s) => ({
        chatMessages: [...s.chatMessages, message],
        chatThreads: s.chatThreads.map((t) =>
          t.id === threadId
            ? // 보낸 사람이 아니라 '받는 쪽'의 미읽음이 올라가야 합니다.
              // 예전엔 아무도 안 올려서 채팅 목록의 미읽음 배지가 시드값에 고정돼 있었습니다.
              { ...t, lastText: text, lastAt: message.createdAt, unread: t.unread + 1 }
            : t,
        ),
      }))
    },

    markThreadRead: (threadId: string) =>
      set((s) => ({
        chatThreads: s.chatThreads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
      })),
  }
}
