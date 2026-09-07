import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label, TextArea, TextInput } from '@/components/ui/Field'
import { kstIso } from '@/lib/datetime'
import { useAppStore, useNow } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/**
 * ★ 역경매 — 내 조건 등록. 등록 후 5초 뒤 공간 제안 2건이 실제로 도착합니다.
 */
export function CreateBidSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const performerId = useAppStore((s) => s.currentPerformerId)
  const performer = useAppStore((s) => s.performers.find((p) => p.id === performerId))
  const nowIso = useNow()
  const createReverseBid = useAppStore((s) => s.createReverseBid)
  const addBidProposal = useAppStore((s) => s.addBidProposal)

  const [region, setRegion] = useState(performer?.baseArea ?? '연남·홍대')
  const [dateStr, setDateStr] = useState(nowIso.slice(0, 10))
  const [minFee, setMinFee] = useState(String(performer?.wantedFee ?? 80000))
  const [message, setMessage] = useState('')

  const submit = () => {
    if (!message.trim()) {
      toast('공간에 전할 메시지를 입력해주세요', 'error')
      return
    }
    if (!performerId) return
    const [y, m, d] = dateStr.split('-').map(Number)
    const bid = createReverseBid({
      performerId,
      wantedRegion: region,
      wantedDates: [kstIso(y, m, d, 20, 0)],
      minFee: Math.max(0, Number(minFee) || 0),
      message: message.trim(),
    })
    toast('역경매를 등록했습니다', 'success', '조건에 맞는 공간을 찾고 있어요')
    setMessage('')
    onClose()

    window.setTimeout(() => {
      const venues = useAppStore.getState().venues
      const matches = venues
        .filter((v) => v.preferredGenres.includes(performer?.genre ?? '밴드'))
        .slice(0, 2)
      const fallback = venues.slice(0, 2)
      const picks = matches.length >= 2 ? matches : fallback
      picks.forEach((v, i) => {
        addBidProposal(bid.id, {
          venueId: v.id,
          fee: Math.max(Number(minFee) || 0, v.rentalFee + 40000) + i * 10000,
          message:
            i === 0
              ? `${v.name}입니다. 말씀하신 조건에 딱 맞는 슬롯이 있어요.`
              : `${v.name}입니다. 요청하신 날짜에 자리 비어있습니다.`,
          createdAt: new Date().toISOString(),
        })
      })
      toast('공간 제안 2건이 도착했습니다', 'success', '역경매 탭에서 확인해보세요')
    }, 5000)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="역경매 등록"
      subtitle="조건을 올리면 공간이 먼저 제안합니다"
      footer={
        <Button full variant="brand" onClick={submit}>
          역경매 등록하기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>희망 지역</Label>
          <TextInput value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div>
          <Label>희망 날짜</Label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
          />
        </div>
        <div>
          <Label>최소 개런티 (원)</Label>
          <TextInput
            inputMode="numeric"
            value={minFee}
            onChange={(e) => setMinFee(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div>
          <Label>메시지</Label>
          <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="필요 장비, 공연 형태 등을 적어주세요" />
        </div>
      </div>
    </BottomSheet>
  )
}
