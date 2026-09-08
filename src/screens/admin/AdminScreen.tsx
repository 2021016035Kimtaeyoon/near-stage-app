import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAdminQueue, useAdminStats, type AdminStats } from '@/hooks/useAdmin'
import type { Query } from '@/hooks/usePublicShows'
import { useAuthStore } from '@/hooks/useAuth'
import { AdminArtistCard, AdminVenueCard } from './AdminCards'

type Tab = 'pending' | 'all' | 'stats'

/**
 * 운영자 화면 (§9).
 *
 * 없으면 서비스가 안 굴러갑니다. 아티스트는 자동 승인 대상이 아니고, 공간도 자동
 * 판정을 통과하지 못하면 여기서 사람이 봐야 합니다. 신고가 들어온 공간을 내리는
 * 것도 이 화면입니다.
 *
 * ★ 접근 제어는 프론트가 아니라 DB 가 합니다. is_admin 이 아니면 RLS 가 대기 목록을
 *   빈 배열로 돌려주므로, 아래 화면 가드는 "빈 화면 대신 설명을 보여주는" 역할입니다.
 */
export function AdminScreen() {
  const profile = useAuthStore((s) => s.profile)
  const loadingAuth = useAuthStore((s) => s.loading)
  const [tab, setTab] = useState<Tab>('pending')

  const queue = useAdminQueue()
  const stats = useAdminStats()

  if (loadingAuth) {
    return (
      <Screen>
        <ScreenHeader title="운영자" />
        <ScreenBody>
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        </ScreenBody>
      </Screen>
    )
  }

  if (!profile?.isAdmin) {
    return (
      <Screen>
        <ScreenHeader title="운영자" />
        <ScreenBody>
          <EmptyState
            art="search"
            title="운영자만 볼 수 있어요"
            description="운영자 계정으로 로그인한 뒤 다시 열어주세요."
          />
        </ScreenBody>
      </Screen>
    )
  }

  const pendingVenues = queue.data.venues.filter((v) => v.status === 'pending')
  const pendingArtists = queue.data.artists.filter((a) => a.status === 'pending')
  const pendingCount = pendingVenues.length + pendingArtists.length

  const refreshAll = () => {
    queue.refresh()
    stats.refresh()
  }

  return (
    <Screen>
      <ScreenHeader
        title="운영자"
        subtitle={`${profile.displayName}님 · 승인 대기 ${pendingCount}건`}
      />
      <ScreenBody>
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-gold-500 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gold-ink">
            <ShieldCheck size={17} />
          </span>
          <p className="min-w-0 flex-1 text-2xs leading-relaxed text-ink-3">
            승인하면 즉시 지도와 목록에 공개됩니다. 반려하면 사유가 등록한 분에게 그대로
            보입니다.
          </p>
          <Button variant="ghost" onClick={refreshAll} aria-label="새로고침">
            <RefreshCw size={15} />
          </Button>
        </div>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'pending', label: `대기 ${pendingCount}` },
            { value: 'all', label: '전체' },
            { value: 'stats', label: '지표' },
          ]}
        />

        <div className="mt-4">
          {queue.loading ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-2" />
              ))}
            </div>
          ) : queue.error ? (
            <EmptyState
              art="search"
              title="불러오지 못했어요"
              description={queue.error}
              action={
                <Button variant="outline" onClick={refreshAll}>
                  다시 시도
                </Button>
              }
            />
          ) : tab === 'stats' ? (
            <StatsPanel stats={stats} />
          ) : tab === 'pending' ? (
            pendingCount === 0 ? (
              <EmptyState
                art="stage"
                title="처리할 대기 건이 없어요"
                description="새 등록이 들어오면 여기에 모입니다."
              />
            ) : (
              <div className="space-y-2.5">
                {pendingVenues.map((v) => (
                  <AdminVenueCard key={v.id} venue={v} onDone={refreshAll} />
                ))}
                {pendingArtists.map((a) => (
                  <AdminArtistCard key={a.id} artist={a} onDone={refreshAll} />
                ))}
              </div>
            )
          ) : queue.data.venues.length + queue.data.artists.length === 0 ? (
            <EmptyState
              art="stage"
              title="아직 등록된 것이 없어요"
              description="공간이나 팀이 등록되면 여기에서 관리합니다."
            />
          ) : (
            <div className="space-y-2.5">
              {queue.data.venues.map((v) => (
                <AdminVenueCard key={v.id} venue={v} onDone={refreshAll} />
              ))}
              {queue.data.artists.map((a) => (
                <AdminArtistCard key={a.id} artist={a} onDone={refreshAll} />
              ))}
            </div>
          )}
        </div>
      </ScreenBody>
    </Screen>
  )
}

/**
 * 지표 — 전부 DB 집계입니다. 값이 없으면 0 을 보여주고 지어내지 않습니다.
 *
 * 훅을 여기서 다시 부르지 않고 위에서 받아옵니다. 따로 부르면 집계 쿼리가 두 벌
 * 나가고, 새로고침 버튼이 화면에 보이는 값을 갱신하지 못합니다.
 */
function StatsPanel({ stats }: { stats: Query<AdminStats | null> }) {
  const { data, loading, error } = stats

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
  if (error || !data) {
    return <EmptyState art="chart" title="지표를 불러오지 못했어요" description={error ?? undefined} />
  }

  const rows: Array<{ label: string; value: number; hint?: string }> = [
    { label: '등록 공간', value: data.venues, hint: `대기 ${data.venuesPending}` },
    { label: '등록 팀', value: data.artists, hint: `대기 ${data.artistsPending}` },
    { label: '전체 공연', value: data.shows, hint: `우리 무대 ${data.ownShows}` },
    { label: '참석 예정', value: data.attendances },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="card px-4 py-3.5">
          <p className="text-2xs text-ink-3">{r.label}</p>
          <p className="tnum mt-1 text-2xl font-extrabold">{r.value}</p>
          {r.hint && <p className="tnum mt-0.5 text-2xs text-ink-3">{r.hint}</p>}
        </div>
      ))}
    </div>
  )
}
