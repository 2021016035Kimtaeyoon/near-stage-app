import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { markThreadRead, sendMessage, useChatThread } from '@/hooks/useChat'
import { useMyVenues } from '@/hooks/useMyResources'
import { cn } from '@/lib/cn'
import { fmt } from '@/lib/datetime'
import { toast } from '@/store/useToast'

/**
 * 대화방 (§13).
 *
 * ★ 보낼 수 있는지는 DB 가 정합니다 — messages_insert_parties 가 이 방의 공간이나
 *   팀을 가진 사람만 통과시킵니다. 화면에서 역할을 보고 판단하던 예전 방식은,
 *   역할 전환 상태에 따라 보낸 사람이 잘못 기록되는 문제가 있었습니다.
 */
export function ChatThreadScreen() {
  const { threadId } = useParams<{ threadId: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const { thread, messages, loading, error, refresh } = useChatThread(threadId)
  const venues = useMyVenues()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadId && userId) void markThreadRead(threadId)
  }, [threadId, userId, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="채팅" back />
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      </Screen>
    )
  }

  if (!thread) {
    return (
      <Screen>
        <ScreenHeader title="채팅" back />
        <EmptyState
          art="chat"
          title={error ? '대화를 불러오지 못했어요' : '대화를 찾을 수 없어요'}
          description={error ?? '이 대화방의 당사자만 들어올 수 있어요.'}
          action={
            <Button variant="outline" onClick={() => navigate('/chat')}>
              대화 목록으로
            </Button>
          }
        />
      </Screen>
    )
  }

  const iAmHost = venues.data.some((v) => v.id === thread.venueId)
  const counterpart = iAmHost ? thread.artistName : thread.venueName

  const submit = async () => {
    const body = text.trim()
    if (!body || !threadId) return
    setBusy(true)
    const err = await sendMessage(threadId, body)
    setBusy(false)
    if (err) {
      toast('보내지 못했어요', 'error', err)
      return
    }
    setText('')
    // Realtime 이 자기 INSERT 도 돌려주지만, 네트워크가 느릴 때 입력창이 비어 있고
    // 말풍선이 안 뜨는 구간이 생깁니다. 한 번 더 읽어 확실히 붙입니다.
    refresh()
  }

  return (
    <Screen>
      <ScreenHeader title={counterpart} subtitle={iAmHost ? '공연팀' : '공연 공간'} back />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <p className="mx-auto max-w-[280px] rounded-xl bg-surface-2 px-3 py-2 text-center text-2xs leading-relaxed text-ink-3">
          공연 시간·장비·개런티를 여기서 맞추세요. 개런티는 두 분이 직접 정하고 공연 당일
          현장에서 정산합니다.
        </p>

        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay =
            !prev || fmt(prev.createdAt, 'MM.DD') !== fmt(m.createdAt, 'MM.DD')
          return (
            <div key={m.id}>
              {newDay && (
                <p className="py-2 text-center text-2xs text-ink-3">{fmt(m.createdAt, 'MM.DD')}</p>
              )}
              <div className={cn('flex', m.isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                    m.isMine
                      ? 'bg-gold-500 rounded-br-md text-gold-ink'
                      : 'rounded-bl-md bg-surface-2 text-ink',
                  )}
                >
                  <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  <span
                    className={cn(
                      'tnum mt-1 block text-right text-[10px]',
                      m.isMine ? 'text-gold-ink/60' : 'text-ink-3',
                    )}
                  >
                    {fmt(m.createdAt, 'HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border px-3 pb-[calc(var(--safe-bottom)+10px)] pt-2.5">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
          placeholder="메시지를 입력하세요"
          maxLength={1000}
          className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none"
        />
        <button
          onClick={() => void submit()}
          disabled={!text.trim() || busy}
          aria-label="보내기"
          className="bg-gold-500 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-gold-ink disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </div>
    </Screen>
  )
}
