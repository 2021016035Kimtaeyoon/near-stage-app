import { Flag, Send, Trash2, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { BRAND_GLOW } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyBlocks } from '@/hooks/useBlocks'
import { addComment, deleteComment, useClipComments } from '@/hooks/useClipSocial'
import { cn } from '@/lib/cn'
import { relativeFromNow } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/**
 * 클립 댓글 시트.
 *
 * 새 댓글은 Realtime 으로 바로 붙습니다 — 댓글창에서 새로고침을 시키면 아무도
 * 두 번째 댓글을 안 답니다.
 *
 * 지우기는 본인 댓글과 자기 클립에 달린 댓글만 보입니다. 자기 무대 아래 달린
 * 악플을 못 지우면 클립을 안 올립니다.
 */
export function ClipComments({
  clipId,
  open,
  onClose,
  onCountChange,
  onReportComment,
}: {
  clipId: string | null
  open: boolean
  onClose: () => void
  onCountChange?: (n: number) => void
  /**
   * ★ 신고 시트를 여기서 열지 않고 위(ClipFeed)로 올립니다. 바텀시트 안에
   *   바텀시트를 두면 안쪽 시트가 부모의 위치 상자(absolute inset-0)에 갇혀
   *   화면 전체가 아니라 댓글 시트 안에만 뜹니다.
   */
  onReportComment?: (commentId: string) => void
}) {
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const { data: rawData, loading, refresh } = useClipComments(open ? clipId : null)
  const blocks = useMyBlocks()
  // ★ 차단은 신고와 달리 판단을 기다리지 않습니다. 내 차단 목록에 있는 사람의
  //   댓글은 이 화면에서 즉시 빠집니다.
  const data = useMemo(
    () => rawData.filter((c) => !blocks.isBlocked(c.userId)),
    [rawData, blocks],
  )
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = () => {
    const body = text.trim()
    if (!body || !clipId) return
    requireAuth(async () => {
      setBusy(true)
      const err = await addComment(clipId, body)
      setBusy(false)
      if (err) {
        toast('댓글을 남기지 못했어요', 'error', err)
        return
      }
      setText('')
      refresh()
      onCountChange?.(data.length + 1)
    })
  }

  const remove = async (id: string) => {
    const err = await deleteComment(id)
    if (err) {
      toast('지우지 못했어요', 'error', err)
      return
    }
    refresh()
    onCountChange?.(Math.max(0, data.length - 1))
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`댓글 ${data.length}`}
      maxHeightPct={78}
      footer={
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={userId ? '댓글 달기…' : '로그인하고 댓글 달기'}
            maxLength={500}
            className="max-h-24 min-h-[42px] flex-1 resize-none rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || busy}
            aria-label="보내기"
            className={cn(
              BRAND_GLOW,
              'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-all duration-base ease-standard active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100',
            )}
          >
            <Send size={17} />
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          art="chat"
          title="아직 댓글이 없어요"
          description="이 무대를 본 소감을 가장 먼저 남겨보세요."
        />
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              {c.authorAvatar ? (
                <img
                  src={c.authorAvatar}
                  alt=""
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-2xs font-bold text-ink-3">
                  {c.authorName.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="truncate text-2xs font-bold">{c.authorName}</span>
                  <span className="tnum shrink-0 text-2xs text-ink-3">
                    {relativeFromNow(c.createdAt, nowIso)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-2">
                  {c.body}
                </p>
              </div>
              {c.isMine ? (
                <button
                  onClick={() => void remove(c.id)}
                  aria-label="댓글 지우기"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3"
                >
                  <Trash2 size={13} />
                </button>
              ) : (
                <div className="flex shrink-0 items-center">
                  {/* ★ 신고 대상에 'comment' 가 있는데 댓글을 신고할 방법이 없었습니다.
                     운영자 화면에는 댓글 신고를 처리하는 자리가 있는데, 그 신고가
                     접수될 입구가 없으니 영영 비어 있는 기능이었습니다. */}
                  <button
                    onClick={() => requireAuth(() => onReportComment?.(c.id))}
                    aria-label="댓글 신고"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3"
                  >
                    <Flag size={13} />
                  </button>
                  {/* ★ 신고는 운영자가 판단할 때까지 기다립니다. 차단은 판단을
                     기다리지 않고 내 화면에서 바로 그 사람 글을 안 보이게 합니다. */}
                  <button
                    onClick={() =>
                      requireAuth(() =>
                        void (async () => {
                          const err = await blocks.block(c.userId, c.authorName)
                          if (err) toast('차단하지 못했어요', 'error', err)
                          else toast('차단했어요', 'default', `${c.authorName}의 글이 안 보여요`)
                        })(),
                      )
                    }
                    aria-label="사용자 차단"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3"
                  >
                    <UserX size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
