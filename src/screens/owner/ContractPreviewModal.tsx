import { FileText } from 'lucide-react'
import { CenterModal } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { SERVICE_NAME } from '@/config/brand'
import { priceLabel } from '@/lib/datetime'
import type { Performer, Venue } from '@/types'

/** 표준 계약서 미리보기 — 텍스트 목업 */
export function ContractPreviewModal({
  open,
  onClose,
  venue,
  performer,
  fee,
}: {
  open: boolean
  onClose: () => void
  venue: Venue
  performer: Performer
  fee: number
}) {
  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title="표준 계약서 미리보기"
      footer={
        <Button full variant="outline" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="space-y-3 text-[13px] leading-relaxed text-ink-2">
        <div className="flex items-center gap-1.5 text-ink">
          <FileText size={15} />
          <span className="font-bold">{SERVICE_NAME} 공연 매칭 표준 계약서</span>
        </div>
        <p>
          <b className="text-ink">제1조 (당사자)</b>
          <br />
          공간: {venue.name} ({venue.address})
          <br />
          아티스트: {performer.teamName} ({performer.memberCount}인)
        </p>
        <p>
          <b className="text-ink">제2조 (공연 조건)</b>
          <br />
          공연 시간: {performer.durationMin}분 · 개런티: {priceLabel(fee)}
          <br />
          필요 장비: {performer.needs.map((n) => n.label).join(', ')}
        </p>
        <p>
          <b className="text-ink">제3조 (취소 및 노쇼)</b>
          <br />
          공연 3일 전 취소 시 개런티의 30%, 24시간 이내 취소 시 전액을 위약금으로 지급합니다.
        </p>
        <p>
          <b className="text-ink">제4조 (플랫폼 수수료)</b>
          <br />
          {SERVICE_NAME}는 본 매칭 성사에 대해 호스트로부터 10,000원의 중개 수수료를 받습니다.
        </p>
        <p>
          <b className="text-ink">제5조 (분쟁 해결)</b>
          <br />
          본 계약과 관련한 분쟁은 {SERVICE_NAME} 고객센터의 중재를 우선으로 합니다.
        </p>
        <p className="text-2xs text-ink-3">
          * 본 계약서는 데모 시연용 목업이며 법적 효력이 없습니다.
        </p>
      </div>
    </CenterModal>
  )
}
