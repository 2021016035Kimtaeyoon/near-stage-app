import { create } from 'zustand'

export type ToastTone = 'default' | 'success' | 'warn' | 'error'

export interface ToastItem {
  id: number
  text: string
  tone: ToastTone
  /** 부가 설명 한 줄 */
  detail?: string
}

interface ToastStore {
  items: ToastItem[]
  push: (text: string, tone?: ToastTone, detail?: string) => void
  remove: (id: number) => void
  clear: () => void
}

let seq = 0

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (text, tone = 'default', detail) => {
    seq += 1
    const id = seq
    set((s) => ({ items: [...s.items, { id, text, tone, detail }] }))
    window.setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2800)
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] }),
}))

/** 컴포넌트에서 편하게 쓰는 헬퍼 */
export function toast(text: string, tone: ToastTone = 'default', detail?: string): void {
  useToastStore.getState().push(text, tone, detail)
}
