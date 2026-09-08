import { AlertCircle, Clock, Music4, Plus, Video, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FreeTrialNotice } from '@/components/ui/FreeTrialNotice'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyArtists, type MyArtist } from '@/hooks/useMyResources'

/**
 * 내 공연팀 — 등록 상태를 보여주는 화면.
 *
 * 공간과 달리 아티스트는 자동 승인하지 않습니다. 주소처럼 기계가 확인할 수 있는
 * 근거가 없기 때문입니다. 그래서 "왜 기다리는지"와 "기다리는 동안 뭘 할 수 있는지"를
 * 적어둡니다 — 상태만 보여주면 사용자는 할 게 없습니다.
 */
export function MyArtistsScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const { data, loading, error, refresh } = useMyArtists()

  const goNew = () => requireAuth(() => navigate('/artist/new'))

  return (
    <Screen>
      <ScreenHeader title="내 공연팀" subtitle="등록한 팀과 공개 상태를 봅니다" />
      <ScreenBody>
        <FreeTrialNotice className="mb-4" />

        {!userId ? (
          <EmptyState
            art="stage"
            title="로그인하면 내 팀을 볼 수 있어요"
            description="팀을 등록하면 조건에 맞는 공간에 지원할 수 있습니다."
            action={
              <Button variant="brand" onClick={goNew}>
                공연팀 등록하기
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
            title="아직 등록한 팀이 없어요"
            description="장르 제한은 없습니다. 밴드·마술·스탠드업·연극·국악 어느 쪽이든 등록할 수 있어요."
            action={
              <Button variant="brand" leading={<Plus size={16} />} onClick={goNew}>
                공연팀 등록하기
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {data.map((a) => (
                <ArtistRow
                  key={a.id}
                  artist={a}
                  onOpen={() => navigate('/performer/posts')}
                  onClips={() => navigate(`/artist/${a.id}/clips`)}
                />
              ))}
            </div>
            <Button
              variant="outline"
              full
              className="mt-4"
              leading={<Plus size={16} />}
              onClick={goNew}
            >
              팀 추가 등록
            </Button>
          </>
        )}

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function ArtistRow({
  artist,
  onOpen,
  onClips,
}: {
  artist: MyArtist
  onOpen: () => void
  onClips: () => void
}) {
  const badge = {
    pending: {
      icon: Clock,
      label: '확인 중',
      cls: 'bg-warn/15 text-warn border-warn/35',
      note: '운영자가 확인하는 중입니다. 그동안 소개글과 영상 링크를 채워두시면 승인 후 바로 지원할 수 있어요.',
    },
    approved: {
      icon: Music4,
      label: '공개 중',
      cls: 'bg-ok/15 text-ok border-ok/35',
      note: '이제 구인글에 지원할 수 있습니다. 조건이 맞는 공간을 찾아보세요.',
    },
    rejected: {
      icon: XCircle,
      label: '반려',
      cls: 'bg-danger/15 text-danger border-danger/35',
      note: artist.rejectReason ?? '사유가 적혀 있지 않습니다. 문의해 주세요.',
    },
  }[artist.status]

  const Icon = badge.icon

  return (
    <div className="card overflow-hidden">
      <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        {artist.photos[0] ? (
          <img
            src={artist.photos[0]}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
            <Music4 size={18} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{artist.teamName}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-bold ${badge.cls}`}
            >
              <Icon size={10} />
              {badge.label}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-2xs text-ink-2">{artist.genre}</span>
        </span>
      </button>

      <p className="flex items-start gap-1.5 border-t border-border bg-surface-2 px-4 py-2.5 text-2xs leading-relaxed text-ink-2">
        <AlertCircle size={11} className="mt-0.5 shrink-0" />
        {badge.note}
      </p>

      {/* 클립은 공연이 끝나야 생깁니다. 등록할 때만 넣을 수 있으면 영영 못 올립니다 */}
      <button
        onClick={onClips}
        className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left"
      >
        <Video size={14} className="shrink-0 text-gold-text" />
        <span className="flex-1 text-2xs font-bold">클립 올리기 · 관리</span>
        <span className="text-2xs text-ink-3">관객 클립 탭에 노출</span>
      </button>
    </div>
  )
}
