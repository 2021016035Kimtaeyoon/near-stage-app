import { Gift } from 'lucide-react'
import { EVENTS } from '@/data/events'
import { fmt } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'
import type { EventTag } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

export function EventsPanel() {
  const nowIso = useNow()
  const now = new Date(nowIso)
  const active = EVENTS.filter((e) => !e.endAt || new Date(e.endAt) >= now)

  if (active.length === 0) {
    return <EmptyState art="ticket" title="진행 중인 이벤트가 없어요" description="새 이벤트가 열리면 알림으로 알려드릴게요." />
  }

  return (
    <div className="space-y-2.5">
      {active.map((e) => (
        <div key={e.id} className="card p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15">
              <Gift size={16} className="text-gold-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <EventTagChip tag={e.tag} />
                {e.endAt && (
                  <span className="tnum text-2xs text-ink-3">{fmt(e.endAt, 'M월 d일(EEE)')}까지</span>
                )}
              </div>
              <p className="mt-1.5 text-[13.5px] font-bold leading-snug">{e.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">{e.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EventTagChip({ tag }: { tag: EventTag }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gold-500/15 px-1.5 py-0.5 text-2xs font-bold text-gold-500">
      {tag}
    </span>
  )
}
