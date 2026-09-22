import { BottomSheet } from '@/components/ui/BottomSheet'
import { QrCode } from '@/components/ui/QrCode'
import { encodeTicket } from '@/lib/ticket'

/**
 * 입장 체크인 QR (§12 후속).
 *
 * 정원까지만 참석 예정을 받게 된 뒤로 추가한 화면입니다 — 정원 안에서는 입장이
 * 실제로 보장되므로, QR을 보여줘도 "보장 안 된 걸 보장하는 척" 하는 게 아닙니다.
 * 그래도 "결제한 티켓"처럼 보이면 안 되서, 문구는 계속 담백하게 둡니다.
 */
export function TicketQrSheet({
  open,
  onClose,
  attendanceId,
  showTitle,
  headcount,
}: {
  open: boolean
  onClose: () => void
  attendanceId: string | null
  showTitle: string
  headcount: number
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="입장 체크인" subtitle={showTitle}>
      <div className="flex flex-col items-center gap-4 py-2">
        {attendanceId && (
          <div className="rounded-2xl bg-white p-4">
            <QrCode value={encodeTicket(attendanceId)} />
          </div>
        )}
        <p className="tnum text-center text-2xs leading-relaxed text-ink-2">
          현장에서 이 QR을 보여주면 호스트·아티스트가 확인해요 ({headcount}명)
          <br />
          결제나 좌석 지정은 없고, 정원 안에서 참석 예정 순서대로 받은 자리예요.
        </p>
      </div>
    </BottomSheet>
  )
}
