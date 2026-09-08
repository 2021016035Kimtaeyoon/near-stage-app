import { CalendarCheck, CheckCircle2, CircleHelp, MapPin, TriangleAlert, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { MiniMap } from '@/components/map/MiniMap'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMyArtists } from '@/hooks/useMyResources'
import { usePublicVenue } from '@/hooks/usePublicVenues'
import { useSlots } from '@/hooks/useSlots'
import { WEEKDAY_LABELS } from '@/lib/datetime'
import { matchNeeds } from '@/lib/needMatch'

/**
 * 공간 상세 (아티스트가 봅니다).
 *
 * ★ 문의 채팅 버튼을 없앴습니다. 대화방은 공간↔팀 한 쌍당 하나이고 수락하는 순간
 *   생깁니다. 아직 관계가 없는 상대에게 먼저 말을 걸 수 있게 하면 그때부터 스팸이
 *   옵니다. 지원은 구인글을 통해서 합니다.
 *
 * 대신 여기서 "언제 비는지"를 보여줍니다 — 그게 아티스트가 알고 싶은 것입니다.
 */
export function PerformerVenueDetail() {
  const { venueId } = useParams<{ venueId: string }>()
  const navigate = useNavigate()
  const { data: venue, loading } = usePublicVenue(venueId)
  const slots = useSlots(venueId ?? null)
  const artists = useMyArtists()

  const myNeeds = artists.data.find((a) => a.status === 'approved')?.needs ?? []

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="공간 상세" back />
        <ScreenBody>
          <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
        </ScreenBody>
      </Screen>
    )
  }

  if (!venue) {
    return (
      <Screen>
        <ScreenHeader title="공간 상세" back />
        <ScreenBody>
          <EmptyState
            art="search"
            title="공간을 찾을 수 없어요"
            description="공개가 중단되었거나 삭제된 공간일 수 있어요."
            action={
              <Button variant="outline" onClick={() => navigate('/performer/explore')}>
                장소 탐색으로
              </Button>
            }
          />
        </ScreenBody>
      </Screen>
    )
  }

  const match = matchNeeds(myNeeds, venue.equipment)
  const openSlots = slots.data.filter((s) => s.isOpen && !s.lockedByShowId)

  return (
    <Screen>
      <ScreenHeader title={venue.name} subtitle={venue.category} back />
      <ScreenBody>
        {venue.photos.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
            {venue.photos.map((p) => (
              <img
                key={p}
                src={p}
                alt=""
                loading="lazy"
                className="h-40 w-56 shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        <div className="card p-3.5">
          <p className="flex items-start gap-1.5 text-2xs text-ink-2">
            <MapPin size={11} className="mt-0.5 shrink-0" />
            {venue.address}
          </p>
          <p className="tnum mt-1.5 flex items-center gap-1.5 text-2xs text-ink-2">
            <Users size={11} className="shrink-0" />
            최대 {venue.capacity}명
          </p>
          {venue.description && (
            <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
              {venue.description}
            </p>
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-border">
          <MiniMap lat={venue.lat} lng={venue.lng} genre={null} />
        </div>

        {/* 언제 비는지 — 아티스트가 가장 알고 싶은 것 */}
        <div className="card mt-3 p-3.5">
          <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold">
            <CalendarCheck size={15} />
            열려 있는 시간
          </h2>
          {slots.loading ? (
            <div className="h-10 animate-pulse rounded-xl bg-surface-2" />
          ) : openSlots.length === 0 ? (
            <p className="text-2xs leading-relaxed text-ink-3">
              지금 열어둔 시간이 없습니다. 구인글이 올라오면 지원할 수 있어요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {openSlots.slice(0, 12).map((s) => {
                const d = new Date(s.startsAt)
                const hm = (x: Date) =>
                  `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
                return (
                  <span
                    key={s.id}
                    className="tnum rounded-lg border border-border px-2 py-1 text-2xs font-semibold text-ink-2"
                  >
                    {d.getMonth() + 1}.{d.getDate()}({WEEKDAY_LABELS[d.getDay()]}) {hm(d)}
                  </span>
                )
              })}
              {openSlots.length > 12 && (
                <span className="px-1 py-1 text-2xs text-ink-3">외 {openSlots.length - 12}개</span>
              )}
            </div>
          )}
        </div>

        {/* 장비 대조 */}
        <div className="card mt-3 p-3.5">
          <h2 className="mb-2 text-[15px] font-bold">장비·조건</h2>
          {myNeeds.length === 0 ? (
            <p className="text-2xs leading-relaxed text-ink-3">
              팀 등록에서 필요한 장비를 적어두시면 이 공간이 조건을 맞추는지 여기서 대조해
              드립니다.
            </p>
          ) : (
            <div className="space-y-1.5">
              {match.checks.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-2 text-2xs">
                  <span className="min-w-0 truncate text-ink-2">{c.label}</span>
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
        </div>

        {venue.preferredGenres.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-2xs font-bold text-ink-3">이 공간이 찾는 장르</p>
            <div className="flex flex-wrap gap-1.5">
              {venue.preferredGenres.map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="brand"
          full
          size="lg"
          className="mt-5"
          onClick={() => navigate('/performer/posts')}
        >
          이 공간의 구인글 찾아보기
        </Button>
        <p className="mt-2 text-center text-2xs leading-relaxed text-ink-3">
          지원은 구인글을 통해서 합니다. 호스트가 수락하면 대화방이 열려 시간·장비를
          맞출 수 있어요.
        </p>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
