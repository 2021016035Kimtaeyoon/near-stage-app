import { MapPin, Music4, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { FreeTrialNotice } from '@/components/ui/FreeTrialNotice'
import { useMyApplications } from '@/hooks/useApplications'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyArtists } from '@/hooks/useMyResources'
import { humanDateTime, relativeFromNow } from '@/lib/datetime'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useNow } from '@/store/useAppStore'

type Tab = 'schedule' | 'applications'

interface ArtistShow {
  id: string
  title: string
  startsAt: string
  durationMin: number
  venueName: string
  venueAddress: string
  goingCount: number
  visitorCount: number | null
  /** 호스트가 이 공연을 취소하며 남긴 사유. 없으면 취소되지 않은 공연입니다 */
  cancelReason: string | null
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v === undefined || v === null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/**
 * 내 공연 — 아티스트가 보는 성과 (§14).
 *
 * ★ 실제 방문객은 호스트가 적어준 값입니다. 안 적었으면 비워둡니다 — 0 으로 채우면
 *   "아무도 안 왔다"로 읽히고, 그 숫자가 다음 지원에 영향을 줍니다.
 *
 * 정산은 다루지 않습니다. 개런티는 호스트와 직접 정하고 현장에서 받으시는 돈이라,
 * 우리가 기록할 근거가 없습니다. 있는 척하면 분쟁이 우리에게 옵니다.
 */
export function PerformerActivity() {
  const navigate = useNavigate()
  const nowIso = useNow()
  const userId = useAuthStore((s) => s.userId)
  const artists = useMyArtists()
  const artistIds = artists.data.map((a) => a.id)
  const applications = useMyApplications(artistIds)

  const [tab, setTab] = useState<Tab>('schedule')
  const [shows, setShows] = useState<ArtistShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const key = artistIds.join(',')

  const load = useCallback(async (ids: string[]) => {
    const { data, error: err } = await supabase
      .from('shows')
      .select(
        'id,title,starts_at,duration_min,cancel_reason,venues!shows_venue_id_fkey(name,address),attendances(headcount,status),show_reports(visitor_count)',
      )
      .in('artist_id', ids)
      .order('starts_at', { ascending: false })
      .limit(100)
    if (err) return { rows: null, message: describeDbError(err) }
    type V = { name: string; address: string }
    type A = { headcount: number; status: string }
    type R = { visitor_count: number }
    const rows: ArtistShow[] = (data ?? []).map((r) => {
      const v = one(r.venues as V | V[] | null)
      const atts = (r.attendances ?? []) as A[]
      const rep = one(r.show_reports as R | R[] | null)
      return {
        id: r.id,
        title: r.title,
        startsAt: r.starts_at,
        durationMin: r.duration_min,
        venueName: v?.name ?? '',
        venueAddress: v?.address ?? '',
        goingCount: atts
          .filter((a) => a.status !== 'canceled')
          .reduce((n, a) => n + a.headcount, 0),
        visitorCount: rep?.visitor_count ?? null,
        cancelReason: r.cancel_reason,
      }
    })
    return { rows, message: null }
  }, [])

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (!isSupabaseConfigured || ids.length === 0) {
      setShows([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void load(ids).then(({ rows, message }) => {
      if (!alive) return
      setLoading(false)
      if (message) {
        setError(message)
        return
      }
      setError(null)
      setShows(rows ?? [])
    })
    return () => {
      alive = false
    }
  }, [key, load])

  if (!userId) {
    return (
      <Screen>
        <ScreenHeader title="내 활동" />
        <ScreenBody>
          <EmptyState
            art="stage"
            title="로그인하면 내 공연을 볼 수 있어요"
            description="지원한 곳과 확정된 무대가 여기 모입니다."
          />
        </ScreenBody>
      </Screen>
    )
  }

  if (!artists.loading && artists.data.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="내 활동" />
        <ScreenBody>
          <EmptyState
            art="stage"
            title="아직 등록한 팀이 없어요"
            description="팀을 등록하면 구인글에 지원할 수 있고, 확정된 무대가 여기 쌓입니다."
            action={
              <Button variant="brand" onClick={() => navigate('/artist/new')}>
                공연팀 등록하기
              </Button>
            }
          />
        </ScreenBody>
      </Screen>
    )
  }

  const now = new Date(nowIso).getTime()
  const upcoming = shows.filter((s) => new Date(s.startsAt).getTime() >= now).reverse()
  const past = shows.filter((s) => new Date(s.startsAt).getTime() < now)
  const totalVisitors = past.reduce((n, s) => n + (s.visitorCount ?? 0), 0)
  const reported = past.filter((s) => s.visitorCount !== null).length
  const pending = applications.data.filter((a) => a.status === 'pending')

  return (
    <Screen>
      <ScreenHeader
        title="내 활동"
        subtitle={artists.data.length === 1 ? artists.data[0].teamName : undefined}
      />
      <ScreenBody>
        <FreeTrialNotice className="mb-4" />

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'schedule', label: `무대 ${shows.length}` },
            { value: 'applications', label: `지원 ${applications.data.length}` },
          ]}
        />

        <div className="mt-4">
          {tab === 'schedule' ? (
            loading ? (
              <div className="space-y-2.5">
                {[0, 1].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
                ))}
              </div>
            ) : error ? (
              <EmptyState art="search" title="불러오지 못했어요" description={error} />
            ) : shows.length === 0 ? (
              <EmptyState
                art="stage"
                title="아직 확정된 무대가 없어요"
                description="구인글에 지원하고 호스트가 수락하면 여기에 무대가 잡힙니다."
                action={
                  <Button variant="brand" onClick={() => navigate('/performer/posts')}>
                    구인글 보기
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {past.length > 0 && (
                  <div className="card p-3.5">
                    <p className="text-2xs text-ink-3">지난 무대에 오신 분</p>
                    <p className="tnum mt-0.5 text-2xl font-extrabold">
                      {reported > 0 ? `${totalVisitors}명` : '기록 전'}
                    </p>
                    <p className="mt-0.5 text-2xs leading-relaxed text-ink-3">
                      {reported > 0
                        ? `공연 ${reported}건 기준 · 호스트가 적어준 실제 방문객입니다`
                        : '호스트가 공연 후 실제 방문객을 적으면 여기에 쌓입니다'}
                    </p>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-2xs font-bold text-ink-3">다가오는 무대</p>
                    <div className="space-y-2">
                      {upcoming.map((s) => (
                        <ShowRow key={s.id} show={s} nowIso={nowIso} onOpen={() => navigate(`/audience/show/${s.id}`)} upcoming />
                      ))}
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-2xs font-bold text-ink-3">지난 무대</p>
                    <div className="space-y-2">
                      {past.map((s) => (
                        <ShowRow key={s.id} show={s} nowIso={nowIso} onOpen={() => navigate(`/audience/show/${s.id}`)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : applications.loading ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
              ))}
            </div>
          ) : applications.data.length === 0 ? (
            <EmptyState
              art="search"
              title="아직 지원한 곳이 없어요"
              description="조건이 맞는 구인글에 지원해보세요."
              action={
                <Button variant="brand" onClick={() => navigate('/performer/posts')}>
                  구인글 보기
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {pending.length > 0 && (
                <p className="text-2xs text-ink-3">
                  답을 기다리는 지원 {pending.length}건. 호스트가 결정하면 알림이 갑니다.
                </p>
              )}
              {applications.data.map((a) => (
                <div key={a.id} className="card p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {a.post?.venueName ?? '삭제된 구인글'}
                    </span>
                    <Tag
                      tone={
                        a.status === 'accepted' ? 'ok' : a.status === 'rejected' ? 'danger' : 'warn'
                      }
                    >
                      {a.status === 'accepted' ? '수락' : a.status === 'rejected' ? '거절' : '대기'}
                    </Tag>
                  </div>
                  <p className="tnum mt-0.5 text-2xs text-ink-3">
                    {relativeFromNow(a.createdAt, nowIso)} 지원
                  </p>
                  <p className="mt-1.5 rounded-lg bg-surface-2 p-2 text-2xs leading-relaxed text-ink-2">
                    “{a.message}”
                  </p>
                  {a.rejectReason && (
                    <p className="mt-1.5 text-2xs text-danger">거절 사유: {a.rejectReason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function ShowRow({
  show,
  nowIso,
  onOpen,
  upcoming = false,
}: {
  show: ArtistShow
  nowIso: string
  onOpen: () => void
  upcoming?: boolean
}) {
  // ★ 호스트가 취소한 공연은 upcoming/past 와 무관하게 취소 사실이 먼저
  //   보여야 합니다 — 전에는 이 화면이 cancel_reason 을 아예 안 가져와서,
  //   취소된 공연도 그냥 '참석 예정 N'으로 보였습니다.
  const canceled = !!show.cancelReason

  return (
    <button onClick={onOpen} className="card flex w-full items-center gap-3 p-3 text-left">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3">
        <Music4 size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{show.title}</span>
        <span className="tnum mt-0.5 block text-2xs text-ink-2">
          {humanDateTime(show.startsAt, nowIso)}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-2xs text-ink-3">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{show.venueName}</span>
        </span>
        {canceled && (
          <span className="mt-0.5 block text-2xs text-danger">{show.cancelReason}</span>
        )}
      </span>
      <span className="shrink-0 text-right">
        {canceled ? (
          <Tag tone="danger">취소됨</Tag>
        ) : upcoming ? (
          <Tag tone="ok">참석 예정 {show.goingCount}</Tag>
        ) : show.visitorCount !== null ? (
          <span className="tnum flex items-center gap-1 text-2xs font-bold text-ink">
            <Users size={11} />
            {show.visitorCount}명
          </span>
        ) : (
          <span className="text-2xs text-ink-3">기록 전</span>
        )}
      </span>
    </button>
  )
}
