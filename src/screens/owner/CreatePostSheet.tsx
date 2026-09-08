import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { MultiChoiceWithOther } from '@/components/ui/ChipsWithOther'
import { Label, TextArea, TextInput } from '@/components/ui/Field'
import { createPost } from '@/hooks/usePosts'
import type { MyVenue } from '@/hooks/useMyResources'
import { toast } from '@/store/useToast'
import { GENRES } from '@/types'

function todayInput(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function plusDaysInput(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

/**
 * 구인글 작성 (§10).
 *
 * ★ 개런티는 참고용 숫자입니다. 플랫폼은 대금에 관여하지 않습니다 —
 *   금액은 호스트와 아티스트가 직접 정하고 현장에서 정산합니다. 그래서 화면에도
 *   그렇게 적어둡니다. 여기서 "결제"처럼 보이면 나중에 분쟁이 우리에게 옵니다.
 */
export function CreatePostSheet({
  open,
  onClose,
  venues,
  onDone,
}: {
  open: boolean
  onClose: () => void
  /** 승인된 공간만 넘어옵니다 */
  venues: MyVenue[]
  onDone: () => void
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '')
  const [genres, setGenres] = useState<string[]>([])
  const [from, setFrom] = useState(todayInput())
  const [to, setTo] = useState(plusDaysInput(14))
  const [fee, setFee] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const target = venues.find((v) => v.id === venueId) ?? venues[0]

  const submit = async () => {
    if (!target) return
    if (genres.length === 0) {
      toast('원하는 장르를 하나 이상 골라주세요', 'warn', '장르를 비우면 아무에게도 안 보입니다')
      return
    }
    if (!message.trim()) {
      toast('아티스트에게 전할 말을 적어주세요', 'warn')
      return
    }
    if (to < from) {
      toast('종료일이 시작일보다 빨라요', 'error')
      return
    }
    setBusy(true)
    const err = await createPost({
      venueId: target.id,
      wantedGenres: genres,
      dateFrom: from,
      dateTo: to,
      offerFee: Math.max(0, Number(fee) || 0),
      message: message.trim(),
    })
    setBusy(false)
    if (err) {
      toast('등록하지 못했어요', 'error', err)
      return
    }
    toast('구인글을 올렸어요', 'success', '아티스트가 이제 지원할 수 있습니다')
    setMessage('')
    setGenres([])
    setFee('')
    onDone()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="구인글 작성"
      subtitle="어떤 팀을 찾는지 알려주세요"
      footer={
        <Button full variant="brand" loading={busy} onClick={() => void submit()}>
          구인글 올리기
        </Button>
      }
    >
      <div className="space-y-4">
        {venues.length > 1 && (
          <div>
            <Label>어느 공간인가요</Label>
            <div className="flex flex-wrap gap-1.5">
              {venues.map((v) => (
                <Chip key={v.id} active={target?.id === v.id} onClick={() => setVenueId(v.id)}>
                  {v.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label hint="고른 장르의 팀에게 보입니다">원하는 장르</Label>
          <MultiChoiceWithOther
            options={GENRES}
            values={genres}
            onChange={setGenres}
            placeholder="쉼표로 여러 개 (예: 판소리, 마임)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>시작일</Label>
            <input
              type="date"
              value={from}
              min={todayInput()}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
          <div>
            <Label>종료일</Label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <Label hint="비워두면 '협의'로 보입니다">개런티 (원)</Label>
          <TextInput
            inputMode="numeric"
            value={fee}
            onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="예) 50000"
          />
          <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
            참고용 금액입니다. 결제는 이 앱을 거치지 않습니다 — 금액은 팀과 직접 정하시고
            공연 당일 현장에서 정산하세요.
          </p>
        </div>

        <div>
          <Label hint="아티스트에게 그대로 보입니다">메시지</Label>
          <TextArea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예) 평일 저녁 8시 이후가 계속 빕니다. 마이크 2개 준비되어 있어요. 손님은 20명쯤 앉습니다."
            maxLength={500}
          />
        </div>
      </div>
    </BottomSheet>
  )
}
