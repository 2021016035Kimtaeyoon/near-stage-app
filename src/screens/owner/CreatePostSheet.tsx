import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { GenreTag } from '@/components/ui/Badge'
import { Label, TextArea, TextInput } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Chip'
import { kstIso } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import { GENRES, type Genre } from '@/types'

function isoDateInput(iso: string): string {
  return iso.slice(0, 10)
}

/** 구인글 작성 폼 — 원하는 장르 다중선택, 날짜 범위, 개런티, 메시지 */
export function CreatePostSheet({
  open,
  onClose,
  venueId,
}: {
  open: boolean
  onClose: () => void
  venueId: string
}) {
  const nowIso = useAppStore((s) => s.demoNowIso)
  const preferredGenres = useAppStore((s) => s.venues.find((v) => v.id === venueId)?.preferredGenres ?? [])
  const createPost = useAppStore((s) => s.createPost)

  const [genres, setGenres] = useState<Genre[]>(preferredGenres.slice(0, 2))
  const [from, setFrom] = useState(isoDateInput(nowIso))
  const [to, setTo] = useState(isoDateInput(nowIso))
  const [revenueShare, setRevenueShare] = useState(false)
  const [fee, setFee] = useState('50000')
  const [message, setMessage] = useState('')

  const toggleGenre = (g: Genre) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))

  const submit = () => {
    if (genres.length === 0) {
      toast('원하는 장르를 1개 이상 선택해주세요', 'error')
      return
    }
    if (!message.trim()) {
      toast('아티스트에게 전할 메시지를 입력해주세요', 'error')
      return
    }
    const [fy, fm, fd] = from.split('-').map(Number)
    const [ty, tm, td] = to.split('-').map(Number)
    createPost({
      venueId,
      wantedGenres: genres,
      dateRange: { from: kstIso(fy, fm, fd, 0, 0), to: kstIso(ty, tm, td, 23, 59) },
      offerFee: revenueShare ? 0 : Math.max(0, Number(fee) || 0),
      message: message.trim(),
    })
    toast('구인글이 등록되었습니다', 'success', '조건에 맞는 아티스트에게 알림이 갔어요')
    setMessage('')
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="구인글 작성"
      subtitle="원하는 장르와 조건을 알려주세요"
      footer={
        <Button full variant="brand" onClick={submit}>
          구인글 등록하기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>원하는 장르 (다중 선택)</Label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <button key={g} onClick={() => toggleGenre(g)} className="tap">
                <span className={genres.includes(g) ? 'opacity-100' : 'opacity-40'}>
                  <GenreTag genre={g} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>시작일</Label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
          <div>
            <Label>종료일</Label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-3.5">
          <Toggle
            checked={revenueShare}
            onChange={setRevenueShare}
            label="수익 배분형"
            hint="대여료 대신 그날 매출의 일부를 나눕니다"
          />
        </div>

        {!revenueShare && (
          <div>
            <Label>제시 개런티 (원)</Label>
            <TextInput
              inputMode="numeric"
              value={fee}
              onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
        )}

        <div>
          <Label hint="아티스트에게 그대로 보입니다">메시지</Label>
          <TextArea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예) 평일 저녁 8시 이후가 계속 빕니다. 마이크 2개 준비되어 있어요."
          />
        </div>
      </div>
    </BottomSheet>
  )
}
