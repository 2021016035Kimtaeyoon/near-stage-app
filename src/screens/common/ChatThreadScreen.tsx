import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SeedAvatar } from '@/components/ui/PosterArt'
import { cn } from '@/lib/cn'
import { fmt } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'

export function ChatThreadScreen() {
  const { threadId } = useParams<{ threadId: string }>()
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const thread = useAppStore((s) => s.chatThreads.find((t) => t.id === threadId))
  const messages = useAppStore((s) => s.chatMessages.filter((m) => m.threadId === threadId))
  const venue = useAppStore((s) => s.venues.find((v) => v.id === thread?.venueId))
  const performer = useAppStore((s) => s.performers.find((p) => p.id === thread?.performerId))
  const sendMessage = useAppStore((s) => s.sendMessage)
  const markThreadRead = useAppStore((s) => s.markThreadRead)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadId) markThreadRead(threadId)
  }, [threadId, markThreadRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (!thread || !venue || !performer) {
    return (
      <Screen>
        <ScreenHeader title="채팅" back />
        <EmptyState art="chat" title="대화를 찾을 수 없어요" />
      </Screen>
    )
  }

  const counterpart = role === 'owner' ? performer.teamName : venue.name
  const counterpartGenre = performer.genre

  const submit = () => {
    if (!text.trim() || !threadId) return
    sendMessage(threadId, role === 'owner' ? 'owner' : 'performer', text.trim())
    setText('')
  }

  return (
    <Screen>
      <ScreenHeader title={counterpart} subtitle={role === 'owner' ? performer.genre : venue.category} back onBack={() => navigate(-1)} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <EmptyState
            art="chat"
            title="아직 나눈 대화가 없어요"
            description={`${counterpart}에게 먼저 메시지를 보내보세요.`}
          />
        )}
        {messages.map((m) => {
          const mine = m.from === role
          return (
            <div key={m.id} className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
              {!mine && <SeedAvatar seed={performer.photoSeed} genre={counterpartGenre} size={28} />}
              <div className={cn('max-w-[72%]', mine ? 'items-end text-right' : 'items-start text-left')}>
                <div
                  className={cn(
                    'inline-block rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                    mine ? 'bg-gold-500 text-gold-ink' : 'border border-border bg-surface-2 text-ink',
                  )}
                >
                  {m.text}
                </div>
                <p className="tnum mt-1 text-2xs text-ink-3">{fmt(m.createdAt, 'HH:mm')}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2.5 pb-[calc(var(--safe-bottom)+10px)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="메시지 보내기"
          className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none placeholder:text-ink-3"
        />
        <button
          onClick={submit}
          aria-label="전송"
          className="bg-gold-500 tap flex items-center justify-center rounded-full text-gold-ink"
        >
          <Send size={17} />
        </button>
      </div>
    </Screen>
  )
}
