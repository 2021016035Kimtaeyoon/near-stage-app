import {
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Music4,
  Play,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { rejectApplication, type Applicant } from '@/hooks/useApplications'
import { useArtistClips } from '@/hooks/useClips'
import { matchNeeds, matchSummary, type VenueEquipment } from '@/lib/needMatch'
import { toast } from '@/store/useToast'

/**
 * 지원자 카드 (§10).
 *
 * 호스트가 수락을 결정하는 데 필요한 것만 담습니다 — 팀 소개, 영상, 그리고
 * ★ 필요 장비와 우리 가게 장비의 항목별 대조.
 *
 * 대조에서 못 읽은 항목은 "직접 확인"으로 남깁니다. 충족으로 처리하면 당일 현장에서
 * 사고가 나고, 미충족으로 처리하면 멀쩡한 팀이 걸러집니다.
 */
export function ApplicantCard({
  applicant,
  equipment,
  onDone,
  accept,
}: {
  applicant: Applicant
  equipment: VenueEquipment
  onDone: () => void
  /** 11단계에서 붙습니다. 없으면 수락 버튼을 아예 그리지 않습니다 */
  accept?: () => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const a = applicant.artist
  // 올린 영상과 링크가 함께 옵니다. clip_urls(링크)만 보면 파일로 올린 팀이
  // "영상 없음"으로 보여서 수락률이 떨어집니다.
  const clips = useArtistClips(a.id)
  const match = matchNeeds(a.needs, equipment)
  const decided = applicant.status !== 'pending'

  const doReject = async () => {
    if (!reason.trim()) {
      toast('거절 사유를 적어주세요', 'warn', '지원한 팀에게 그대로 보입니다')
      return
    }
    setBusy(true)
    const err = await rejectApplication(applicant.id, reason.trim())
    setBusy(false)
    if (err) {
      toast('처리하지 못했어요', 'error', err)
      return
    }
    toast('거절했어요', 'success')
    setRejecting(false)
    onDone()
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-3 p-3.5">
        {a.photos[0] ? (
          <img
            src={a.photos[0]}
            alt=""
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
            <Music4 size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold">{a.teamName}</span>
            {decided && (
              <Tag tone={applicant.status === 'accepted' ? 'ok' : 'danger'}>
                {applicant.status === 'accepted' ? '수락' : '거절'}
              </Tag>
            )}
          </div>
          <p className="mt-0.5 text-2xs text-ink-2">
            {a.genre} · {a.memberCount}명 · {a.durationMin}분
          </p>
          {a.bio && <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-ink-3">{a.bio}</p>}
          {clips.data.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {clips.data.slice(0, 3).map((c) =>
                c.kind === 'upload' ? (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-2xs font-semibold text-gold-text"
                  >
                    올린 영상{c.durationSec ? ` ${c.durationSec}초` : ''}
                    <Play size={10} />
                  </a>
                ) : (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-2xs font-semibold text-gold-text"
                  >
                    영상 보기
                    <ExternalLink size={10} />
                  </a>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {applicant.message && (
        <p className="mx-3.5 rounded-lg bg-surface-2 p-2.5 text-[13px] leading-relaxed text-ink-2">
          “{applicant.message}”
        </p>
      )}
      {applicant.rejectReason && (
        <p className="mx-3.5 mt-1.5 text-2xs text-danger">거절 사유: {applicant.rejectReason}</p>
      )}

      <div className="m-3.5 rounded-xl border border-border p-3">
        <p className="mb-2 text-2xs font-bold text-ink-2">
          장비 조건 대조 · {matchSummary(match)}
        </p>
        {match.checks.length === 0 ? (
          <p className="text-2xs text-ink-3">
            이 팀은 필요한 장비를 적지 않았습니다. 채팅으로 직접 물어보세요.
          </p>
        ) : (
          <div className="space-y-1.5">
            {match.checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-2 text-2xs">
                <span
                  className={
                    c.ok === false ? 'font-semibold text-warn' : 'min-w-0 truncate text-ink-2'
                  }
                >
                  {c.label}
                </span>
                <span
                  className={`flex shrink-0 items-center gap-1 font-semibold ${
                    c.ok === true ? 'text-ok' : c.ok === false ? 'text-warn' : 'text-ink-3'
                  }`}
                >
                  {c.ok === true ? (
                    <CheckCircle2 size={12} />
                  ) : c.ok === false ? (
                    <TriangleAlert size={12} />
                  ) : (
                    <CircleHelp size={12} />
                  )}
                  {c.actual || '직접 확인'}
                </span>
              </div>
            ))}
          </div>
        )}
        {match.missingCount > 0 && (
          <p className="mt-2 text-2xs leading-relaxed text-ink-3">
            부족한 항목이 있어도 수락할 수 있습니다. 팀과 상의해 대여하거나 빼고 진행하는 경우가
            많습니다.
          </p>
        )}
      </div>

      {!decided &&
        (rejecting ? (
          <div className="border-t border-border p-3">
            <TextInput
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="거절 사유 (지원한 팀에게 그대로 보입니다)"
              maxLength={120}
            />
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                취소
              </Button>
              <Button
                variant="danger"
                size="sm"
                full
                loading={busy}
                onClick={() => void doReject()}
              >
                거절하기
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 border-t border-border p-3">
            <Button
              variant="outline"
              size="sm"
              leading={<XCircle size={13} />}
              onClick={() => setRejecting(true)}
            >
              거절
            </Button>
            {accept && (
              <Button
                variant="brand"
                size="sm"
                full
                leading={<CheckCircle2 size={13} />}
                onClick={accept}
              >
                수락하고 공연 만들기
              </Button>
            )}
          </div>
        ))}
    </div>
  )
}
