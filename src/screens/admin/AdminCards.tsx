import { Check, ExternalLink, MapPin, Music4, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { setApproval, type PendingArtist, type PendingVenue } from '@/hooks/useAdmin'
import { toast } from '@/store/useToast'

/**
 * 승인 대기 카드.
 *
 * 운영자가 판단하는 데 필요한 것만 한 화면에 모읍니다 — 사진, 주소, 규모, 소개글.
 * 반려는 사유를 반드시 적게 합니다. 사유 없는 반려는 등록한 분이 무엇을 고쳐야 할지
 * 알 수 없어서, 그냥 포기하게 만듭니다.
 */

const STATUS_LABEL: Record<PendingVenue['status'], { text: string; cls: string }> = {
  pending: { text: '대기', cls: 'bg-warn/15 text-warn border-warn/35' },
  approved: { text: '공개 중', cls: 'bg-ok/15 text-ok border-ok/35' },
  rejected: { text: '반려', cls: 'bg-danger/15 text-danger border-danger/35' },
}

function StatusBadge({ status }: { status: PendingVenue['status'] }) {
  const s = STATUS_LABEL[status]
  return (
    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-2xs font-bold ${s.cls}`}>
      {s.text}
    </span>
  )
}

/** 승인·반려 버튼 묶음 — 공간과 팀이 같은 동작을 합니다 */
function Actions({
  table,
  id,
  status,
  onDone,
}: {
  table: 'venues' | 'artists'
  id: string
  status: PendingVenue['status']
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const run = async (next: 'approved' | 'rejected') => {
    if (next === 'rejected' && !reason.trim()) {
      toast('반려 사유를 적어주세요', 'warn', '등록한 분에게 그대로 보입니다')
      return
    }
    setBusy(true)
    const err = await setApproval(table, id, next, reason.trim())
    setBusy(false)
    if (err) {
      toast('처리하지 못했어요', 'error', err)
      return
    }
    toast(next === 'approved' ? '승인했어요' : '반려했어요', 'success')
    setRejecting(false)
    setReason('')
    onDone()
  }

  if (rejecting) {
    return (
      <div className="border-t border-border p-3">
        <TextInput
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="반려 사유 (등록한 분에게 그대로 보입니다)"
          maxLength={120}
        />
        <div className="mt-2 flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
            취소
          </Button>
          <Button variant="danger" size="sm" full loading={busy} onClick={() => void run('rejected')}>
            반려하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 border-t border-border p-3">
      {status !== 'rejected' && (
        <Button variant="outline" size="sm" leading={<X size={13} />} onClick={() => setRejecting(true)}>
          반려
        </Button>
      )}
      {status !== 'approved' && (
        <Button
          variant="brand"
          size="sm"
          full
          loading={busy}
          leading={<Check size={13} />}
          onClick={() => void run('approved')}
        >
          승인
        </Button>
      )}
      {status === 'approved' && (
        <Button variant="outline" size="sm" full loading={busy} onClick={() => setRejecting(true)}>
          공개 내리기
        </Button>
      )}
    </div>
  )
}

export function AdminVenueCard({ venue, onDone }: { venue: PendingVenue; onDone: () => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-3 p-3.5">
        {venue.photos[0] ? (
          <img
            src={venue.photos[0]}
            alt=""
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
            <MapPin size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{venue.name}</span>
            <StatusBadge status={venue.status} />
          </div>
          <p className="mt-0.5 text-2xs text-ink-2">
            공간 · {venue.category} · 최대 {venue.capacity}명
          </p>
          <p className="mt-0.5 truncate text-2xs text-ink-3">{venue.address}</p>
          <p className="mt-0.5 text-2xs text-ink-3">
            등록 {venue.ownerName ?? '이름 없음'}
          </p>
          <a
            href={`https://map.kakao.com/link/map/${encodeURIComponent(venue.name)},${venue.lat},${venue.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold text-gold-text"
          >
            지도에서 위치 확인
            <ExternalLink size={10} />
          </a>
          {venue.description && (
            <p className="mt-1.5 line-clamp-3 text-2xs leading-relaxed text-ink-2">
              {venue.description}
            </p>
          )}
        </div>
      </div>
      <Actions table="venues" id={venue.id} status={venue.status} onDone={onDone} />
    </div>
  )
}

export function AdminArtistCard({ artist, onDone }: { artist: PendingArtist; onDone: () => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-3 p-3.5">
        {artist.photos[0] ? (
          <img
            src={artist.photos[0]}
            alt=""
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
            <Music4 size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{artist.teamName}</span>
            <StatusBadge status={artist.status} />
          </div>
          <p className="mt-0.5 text-2xs text-ink-2">
            팀 · {artist.genre} · {artist.memberCount}명 · {artist.durationMin}분
          </p>
          <p className="mt-0.5 text-2xs text-ink-3">등록 {artist.ownerName ?? '이름 없음'}</p>
          {artist.bio && (
            <p className="mt-1.5 line-clamp-3 text-2xs leading-relaxed text-ink-2">{artist.bio}</p>
          )}
          {artist.clipUrls.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {artist.clipUrls.map((u) => (
                <a
                  key={u}
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-2xs font-semibold text-gold-text"
                >
                  영상 보기
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <Actions table="artists" id={artist.id} status={artist.status} onDone={onDone} />
    </div>
  )
}
