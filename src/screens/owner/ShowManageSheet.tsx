import { QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label, TextInput } from '@/components/ui/Field'
import { PhotoUploader } from '@/screens/host/PhotoUploader'
import { saveShowCapacity, type VenueShow } from '@/hooks/useVenueStats'
import { toast } from '@/store/useToast'

/**
 * 정원·좌석 배치도 관리 + 체크인 진입 (§12 후속).
 *
 * ★ 정원은 원래 공간 정원을 그대로 물려받습니다(fn_accept_application). 특정
 *   공연만 좌석을 줄여야 할 수도 있어서(예: 리허설 공간을 일부만 씀) 여기서
 *   따로 고칠 수 있게 열어둡니다.
 */
export function ShowManageSheet({
  show,
  open,
  onClose,
  onDone,
}: {
  show: VenueShow | null
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const navigate = useNavigate()
  const [capacity, setCapacity] = useState('')
  const [seatMap, setSeatMap] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && show) {
      setCapacity(String(show.capacity))
      setSeatMap(show.seatMapUrl ? [show.seatMapUrl] : [])
    }
  }, [open, show])

  const submit = async () => {
    if (!show) return
    const n = Number(capacity)
    if (!Number.isFinite(n) || n <= 0) {
      toast('정원은 1 이상의 숫자로 적어주세요', 'error')
      return
    }
    setBusy(true)
    const err = await saveShowCapacity(show.id, Math.round(n), seatMap[0] ?? null)
    setBusy(false)
    if (err) {
      toast('저장하지 못했어요', 'error', err)
      return
    }
    toast('저장했어요', 'success')
    onDone()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="공연 관리"
      subtitle={show?.title}
      footer={
        <Button full variant="brand" loading={busy} onClick={() => void submit()}>
          저장하기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label hint="선착순으로 이 인원까지만 참석 예정을 받습니다">정원 (명)</Label>
          <TextInput
            type="number"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
            min={1}
          />
          {show && (
            <p className="tnum mt-1 text-2xs text-ink-3">
              지금 참석 예정 {show.goingCount}명이 등록돼 있어요
            </p>
          )}
        </div>

        <div>
          <Label hint="없어도 괜찮습니다. 있으면 관객이 참석 전에 볼 수 있어요">
            좌석 배치도 (선택)
          </Label>
          <PhotoUploader bucket="show-seatmaps" photos={seatMap} onChange={setSeatMap} max={1} />
        </div>

        <button
          onClick={() => navigate('/checkin')}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 py-3 text-sm font-bold"
        >
          <QrCode size={15} />
          입장 QR 체크인 열기
        </button>
      </div>
    </BottomSheet>
  )
}
