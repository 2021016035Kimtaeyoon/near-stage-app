import { CheckCircle2, MessageSquare, QrCode, TriangleAlert, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { matchNeeds } from '@/lib/needMatch'
import { humanDateTime } from '@/lib/datetime'
import type { MyVenue } from '@/hooks/useMyResources'
import { soonShows, type VenueShow } from '@/hooks/useVenueStats'

/**
 * 공연 전 확인 목록 (§14).
 *
 * ★ 체크리스트 항목을 지어내지 않습니다. "당일 준비물 챙기기"처럼 앱이 확인할 수
 *   없는 일반론을 나열하면 그건 조언이 아니라 소음입니다. 여기 있는 항목은
 *   전부 이 서비스가 실제로 아는 사실입니다 — 참석 예정 인원(attendances),
 *   팀이 등록 시 적어둔 필요 장비 대 우리 공간 장비(matchNeeds), 그리고 대화방
 *   존재 여부(공연이 확정되면 fn_accept_application 이 항상 만듭니다).
 *
 * ★ 정산은 다루지 않습니다 — 개런티는 호스트와 아티스트가 직접 정하는 돈이라
 *   우리가 기록할 근거가 없습니다. 체크인(QR)은 다룹니다 — 정원까지만 선착순으로
 *   받으므로(0033_ticket_checkin.sql), 정원 안에서는 입장이 실제로 보장됩니다.
 */
export function PreShowChecklist({
  shows,
  venues,
  threadIdFor,
  nowIso,
}: {
  /** 다가오는 공연 전체 — 이 컴포넌트가 "곧"만 추려냅니다 */
  shows: VenueShow[]
  venues: MyVenue[]
  /** (공간, 팀) 쌍의 대화방 id. 아직 안 만들어졌으면(드묾) undefined */
  threadIdFor: (venueId: string, artistId: string) => string | undefined
  nowIso: string
}) {
  const navigate = useNavigate()
  const soon = soonShows(shows, nowIso)

  if (soon.length === 0) return null

  const venueById = new Map(venues.map((v) => [v.id, v]))

  return (
    <div className="space-y-2.5">
      {soon.map((s) => {
        const venue = venueById.get(s.venueId)
        const match = matchNeeds(s.artistNeeds, venue?.equipment ?? null)
        const threadId = threadIdFor(s.venueId, s.artistId)

        return (
          <div key={s.id} className="card p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-bold">{s.title}</p>
              <p className="tnum shrink-0 text-2xs text-ink-3">
                {humanDateTime(s.startsAt, nowIso)}
              </p>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <ChecklistLine
                icon={Users}
                tone="info"
                text={
                  s.goingCount > 0
                    ? `참석 예정 ${s.goingCount}명`
                    : '아직 참석 예정을 누른 관객이 없어요'
                }
              />

              {match.checks.length === 0 ? (
                <ChecklistLine icon={TriangleAlert} tone="unknown" text="이 팀이 필요 장비를 적지 않았어요" />
              ) : match.missingCount > 0 ? (
                <ChecklistLine
                  icon={TriangleAlert}
                  tone="warn"
                  text={`장비 부족 ${match.missingCount}개 · ${match.checks
                    .filter((c) => c.ok === false)
                    .map((c) => c.label)
                    .join(', ')}`}
                />
              ) : match.unknownCount > 0 ? (
                <ChecklistLine
                  icon={TriangleAlert}
                  tone="unknown"
                  text={`직접 확인 필요 ${match.unknownCount}개 · ${match.checks
                    .filter((c) => c.ok === null)
                    .map((c) => c.label)
                    .join(', ')}`}
                />
              ) : (
                <ChecklistLine icon={CheckCircle2} tone="ok" text="장비 조건 다 갖췄어요" />
              )}
            </div>

            <div className="mt-3 flex items-center gap-4">
              {threadId && (
                <button
                  onClick={() => navigate(`/chat/${threadId}`)}
                  className="flex items-center gap-1.5 text-2xs font-bold text-gold-text"
                >
                  <MessageSquare size={13} />
                  도착 시간·리허설 대화로 확인하기
                </button>
              )}
              <button
                onClick={() => navigate('/checkin')}
                className="flex items-center gap-1.5 text-2xs font-bold text-gold-text"
              >
                <QrCode size={13} />
                입장 QR 체크인
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChecklistLine({
  icon: Icon,
  tone,
  text,
}: {
  icon: typeof Users
  tone: 'ok' | 'warn' | 'unknown' | 'info'
  text: string
}) {
  const color =
    tone === 'ok'
      ? 'text-ok'
      : tone === 'warn'
        ? 'text-danger'
        : tone === 'unknown'
          ? 'text-warn'
          : 'text-ink-2'
  return (
    <p className={`flex items-start gap-1.5 text-2xs leading-relaxed ${color}`}>
      <Icon size={13} className="mt-0.5 shrink-0" />
      <span>{text}</span>
    </p>
  )
}
