import { UserX } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyBlocks } from '@/hooks/useBlocks'
import { cn } from '@/lib/cn'
import { toast } from '@/store/useToast'

/**
 * 차단한 사람 목록 (§16).
 *
 * 차단은 판단을 기다리지 않고 즉시 반영됩니다 — 신고와 달리 운영자를 거치지
 * 않습니다. 여기서 언제든 풀 수 있습니다.
 */
export function BlockedUsersPanel({ compact = false }: { compact?: boolean }) {
  const userId = useAuthStore((s) => s.userId)
  const blocks = useMyBlocks()

  if (!userId || blocks.data.length === 0) return null

  return (
    <section className={cn('card overflow-hidden', compact ? 'mb-0' : 'mb-4')}>
      <div className="flex items-center gap-1.5 px-4 pb-2.5 pt-3.5">
        <UserX size={15} className="text-ink-3" />
        <h2 className="text-[13px] font-bold">차단한 사람</h2>
        <span className="tnum ml-auto rounded-full bg-surface-2 px-2 py-1 text-2xs font-bold text-ink-2">
          {blocks.data.length}
        </span>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {blocks.data.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="truncate text-[13px] font-bold">{b.name}</span>
            <button
              onClick={() =>
                void (async () => {
                  const err = await blocks.unblock(b.id)
                  if (err) toast('풀지 못했어요', 'error', err)
                  else toast('차단을 풀었어요', 'default', b.name)
                })()
              }
              className="shrink-0 rounded-full border border-border-strong px-2.5 py-1 text-2xs font-bold text-ink-2 active:bg-surface-2"
            >
              차단 풀기
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
