import { AlertCircle, Clock, MapPin, Plus, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FreeTrialNotice } from '@/components/ui/FreeTrialNotice'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyVenues, type MyVenue } from '@/hooks/useMyResources'

/**
 * 내 공간 목록 — 심사 상태를 보여주는 화면 (§8-1).
 *
 * 주소와 필수 항목이 확인되면 등록 즉시 공개됩니다. 확인이 안 된 경우에만 심사
 * 대기로 남고, 그때 "왜 대기인지"와 "무엇을 고치면 되는지"를 적어줍니다. 상태만
 * 보여주고 다음 행동을 알려주지 않으면 사장님이 할 수 있는 게 없습니다.
 */
export function MyVenuesScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const { data, loading, error, refresh } = useMyVenues()

  const goNew = () => requireAuth(() => navigate('/host/venue/new'))

  return (
    <Screen>
      <ScreenHeader title="내 공간" subtitle="등록한 공간과 공개 상태를 봅니다" />
      <ScreenBody>
        <FreeTrialNotice className="mb-4" />

        {!userId ? (
          <EmptyState
            art="stage"
            title="로그인하면 내 공간을 볼 수 있어요"
            description="가게를 등록하면 조건에 맞는 공연팀이 지원합니다."
            action={
              <Button variant="brand" onClick={goNew}>
                우리 가게 등록하기
              </Button>
            }
          />
        ) : loading ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            art="search"
            title="불러오지 못했어요"
            description={error}
            action={
              <Button variant="outline" onClick={refresh}>
                다시 시도
              </Button>
            }
          />
        ) : data.length === 0 ? (
          <EmptyState
            art="stage"
            title="아직 등록한 공간이 없어요"
            description="손님이 앉을 자리와 공연할 한 평 정도만 있으면 됩니다. 무대나 음향 장비가 없어도 괜찮아요."
            action={
              <Button variant="brand" leading={<Plus size={16} />} onClick={goNew}>
                우리 가게 등록하기
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {data.map((v) => (
                <VenueRow key={v.id} venue={v} onOpen={() => navigate('/host/dashboard')} />
              ))}
            </div>
            <Button variant="outline" full className="mt-4" leading={<Plus size={16} />} onClick={goNew}>
              공간 추가 등록
            </Button>
          </>
        )}

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function VenueRow({ venue, onOpen }: { venue: MyVenue; onOpen: () => void }) {
  const badge = {
    pending: {
      icon: Clock,
      label: '심사 중',
      cls: 'bg-warn/15 text-warn border-warn/35',
      note:
        '주소나 필수 항목을 자동으로 확인하지 못해 운영자 확인을 기다립니다. 주소를 다시 검색하고 지도에서 위치를 정확히 찍어주시면 대개 바로 공개됩니다.',
    },
    approved: {
      icon: MapPin,
      label: '공개 중',
      cls: 'bg-ok/15 text-ok border-ok/35',
      note: '지도에 노출되고 있습니다. 이제 구인글을 올려 공연팀을 찾아보세요.',
    },
    rejected: {
      icon: XCircle,
      label: '반려',
      cls: 'bg-danger/15 text-danger border-danger/35',
      note: venue.rejectReason ?? '사유가 적혀 있지 않습니다. 문의해 주세요.',
    },
  }[venue.status]

  const Icon = badge.icon

  return (
    <div className="card overflow-hidden">
      <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        {venue.photos[0] ? (
          <img
            src={venue.photos[0]}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
            <MapPin size={18} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{venue.name}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-bold ${badge.cls}`}
            >
              <Icon size={10} />
              {badge.label}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-2xs text-ink-2">
            {venue.category} · 최대 {venue.capacity}명
          </span>
          <span className="mt-0.5 block truncate text-2xs text-ink-3">{venue.address}</span>
        </span>
      </button>

      <p className="flex items-start gap-1.5 border-t border-border bg-surface-2 px-4 py-2.5 text-2xs leading-relaxed text-ink-2">
        <AlertCircle size={11} className="mt-0.5 shrink-0" />
        {badge.note}
      </p>
    </div>
  )
}
