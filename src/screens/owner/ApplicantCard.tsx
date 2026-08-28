import { CheckCircle2, Clapperboard, FileText, TriangleAlert, XCircle } from 'lucide-react'
import { useState } from 'react'
import { GenreTag, Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PosterArt, Rating } from '@/components/ui/PosterArt'
import { relativeFromNow } from '@/lib/datetime'
import { matchNeeds } from '@/lib/match'
import type { Application, Performer, Venue } from '@/types'
import { ContractPreviewModal } from './ContractPreviewModal'

interface Props {
  application: Application
  performer: Performer
  venue: Venue
  nowIso: string
  offerFee: number
  onAccept: () => void
  onReject: () => void
}

/** 지원자 카드 — 클립 미리보기 + ★ 필요 장비 vs 내 공간 장비 자동 매칭 표시 */
export function ApplicantCard({
  application,
  performer,
  venue,
  nowIso,
  offerFee,
  onAccept,
  onReject,
}: Props) {
  const [contractOpen, setContractOpen] = useState(false)
  const match = matchNeeds(performer, venue)
  const decided = application.status !== '대기'

  return (
    <div className="card p-3.5">
      <div className="flex items-start gap-3">
        <PosterArt seed={performer.photoSeed} genre={performer.genre} className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <GenreTag genre={performer.genre} size="sm" />
            {decided && (
              <Tag tone={application.status === '수락' ? 'ok' : 'danger'}>{application.status}</Tag>
            )}
          </div>
          <h3 className="mt-1 truncate text-[15px] font-bold">{performer.teamName}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <Rating value={performer.rating} count={performer.reviewCount} />
            <span className="tnum text-2xs text-ink-3">지원 {relativeFromNow(application.createdAt, nowIso)}</span>
          </div>
        </div>
      </div>

      <p className="mt-2.5 rounded-lg bg-surface-2 p-2.5 text-[13px] leading-relaxed text-ink-2">
        “{application.message}”
      </p>
      {application.rejectReason && (
        <p className="mt-1.5 text-2xs text-danger">거절 사유: {application.rejectReason}</p>
      )}

      <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
        {performer.clipTitles.slice(0, 3).map((title, i) => (
          <div key={title} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
            <PosterArt seed={`${performer.photoSeed}-clip-${i}`} genre={performer.genre} className="h-full w-full" deep glyphScale={0.6} />
            <Clapperboard size={11} className="absolute bottom-1 right-1 text-white/80" />
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-border p-3">
        <p className="mb-2 text-2xs font-bold text-ink-2">
          장비 조건 대조 · {match.satisfiedCount}/{match.totalCount} 충족
        </p>
        <div className="space-y-1.5">
          {match.checks.map((c) => (
            <div key={c.need.key} className="flex items-center justify-between text-2xs">
              <span className={c.ok ? 'text-ink-2' : 'font-semibold text-warn'}>{c.need.label} 필요</span>
              <span className={c.ok ? 'flex items-center gap-1 font-semibold text-ok' : 'flex items-center gap-1 font-bold text-warn'}>
                {c.ok ? <CheckCircle2 size={12} /> : <TriangleAlert size={12} />}
                {c.actualLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!decided && (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" leading={<FileText size={13} />} onClick={() => setContractOpen(true)}>
            계약서
          </Button>
          <Button variant="danger" size="sm" leading={<XCircle size={13} />} onClick={onReject} className="flex-1">
            거절
          </Button>
          <Button variant="brand" size="sm" leading={<CheckCircle2 size={13} />} onClick={onAccept} className="flex-1">
            수락
          </Button>
        </div>
      )}

      <ContractPreviewModal
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        venue={venue}
        performer={performer}
        fee={offerFee}
      />
    </div>
  )
}
