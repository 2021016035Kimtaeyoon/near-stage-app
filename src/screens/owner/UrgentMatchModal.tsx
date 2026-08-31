import { Send, Zap } from 'lucide-react'
import { useState } from 'react'
import { CenterModal } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Field'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Venue } from '@/types'

/**
 * ★ 긴급 매칭 — "오늘 저녁 비었어요" 버튼.
 * 발송하면 구인글이 즉시 생성되고, 3초 뒤 가짜 지원 2건이 실제로 posts에 추가되어
 * 알림으로 도착합니다(setTimeout으로 실제 동작).
 */
export function UrgentMatchModal({
  open,
  onClose,
  venue,
}: {
  open: boolean
  onClose: () => void
  venue: Venue
}) {
  const [message, setMessage] = useState(`${venue.name} 오늘 저녁 시간이 비었어요! 지금 바로 연락주세요.`)
  const [sent, setSent] = useState(false)

  const send = () => {
    const postId = useAppStore.getState().sendUrgentMatch(venue.id, message)
    setSent(true)
    toast('반경 내 아티스트에게 긴급 매칭 요청을 보냈습니다', 'success')

    window.setTimeout(() => {
      const state = useAppStore.getState()
      const candidates = state.performers
        .filter((p) => venue.preferredGenres.includes(p.genre))
        .slice(0, 2)
      const fallback = state.performers.slice(0, 2)
      const picks = candidates.length >= 2 ? candidates : fallback
      picks.forEach((performer, i) => {
        state.applyToPost(
          postId,
          performer.id,
          i === 0
            ? '지금 바로 갈 수 있어요! 장비만 확인해주세요.'
            : '오늘 저녁 스케줄 비어있습니다. 30분 내 도착 가능해요.',
        )
      })
      toast('지원자 2명이 도착했습니다', 'success', '구인 탭에서 바로 확인해보세요')
    }, 3000)
  }

  return (
    <CenterModal
      open={open}
      onClose={() => {
        setSent(false)
        onClose()
      }}
      title="긴급 매칭"
      footer={
        sent ? (
          <Button full variant="outline" onClick={onClose}>
            닫기
          </Button>
        ) : (
          <Button full variant="brand" leading={<Send size={15} />} onClick={send}>
            반경 2km 아티스트에게 발송
          </Button>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="bg-gold-500 flex h-12 w-12 items-center justify-center rounded-full text-gold-ink">
            <Zap size={22} />
          </span>
          <p className="mt-3 text-sm font-bold">발송 완료!</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">
            반경 내 {venue.preferredGenres.join('·')} 아티스트에게 알림을 보냈어요.
            <br />
            지원이 도착하면 알려드릴게요.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs leading-relaxed text-ink-2">
            {venue.district} 반경 2km 안의 {venue.preferredGenres.join('·')} 아티스트에게 즉시
            알림이 발송됩니다.
          </p>
          <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      )}
    </CenterModal>
  )
}
