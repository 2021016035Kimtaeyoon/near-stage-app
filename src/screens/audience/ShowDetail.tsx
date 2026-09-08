import { ChevronLeft, Flag, PenLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportSheet } from '@/components/ui/ReportSheet'
import { FreeTrialNotice } from '@/components/ui/FreeTrialNotice'
import { useAuthStore } from '@/hooks/useAuth'
import {
  cancelAttendance,
  setAttendance,
  useMyAttendances,
  useMyFollows,
  useMyLikes,
} from '@/hooks/useEngagement'
import { useArtist } from '@/hooks/useArtist'
import { useShowReviews, type ShowReview } from '@/hooks/useReviews'
import { usePublicShow } from '@/hooks/usePublicShows'
import { showPriceLabel } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Review } from '@/types'
import { KopisCastBlock, PerformerBlock } from './PerformerBlock'
import { ReviewTabs } from './ReviewTabs'
import { ShowDetailHero } from './ShowDetailHero'
import { VenueBlock } from './VenueBlock'

/**
 * 공연 상세 (§12).
 *
 * 예전에는 목 스토어(shows: [])에서 공연을 찾아서, 지도에서 실제 공연을 눌러도
 * "공연을 찾을 수 없어요"만 떴습니다. 이제 v_public_shows 를 읽습니다.
 *
 * ★ 좋아요·팔로우는 본인 행만 읽히므로(RLS) "내가 눌렀는지"는 내 목록에서 보고,
 *   "몇 명이 눌렀는지"는 뷰가 집계한 값을 씁니다.
 */
export function ShowDetail() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const nowIso = useNow()
  const requireAuth = useAuthStore((s) => s.requireAuth)

  const { data: meta, loading, error, refresh } = usePublicShow(showId)
  const likes = useMyLikes()
  const follows = useMyFollows()
  const attendances = useMyAttendances()
  const reviews = useShowReviews(showId)
  // 목록에는 이름·장르만 실려 옵니다. 소개글·셋리스트는 여기서 따로 읽습니다.
  const artist = useArtist(meta?.performer?.id)
  const [busy, setBusy] = useState(false)
  const [headcount, setHeadcount] = useState(1)
  const [reportOpen, setReportOpen] = useState(false)

  const show = meta?.show ?? null
  const place = meta?.place ?? null
  const performer = meta?.performer ?? null

  // DB 의 target_type('venue'|'artist')을 화면 타입('venue'|'performer')으로 맞춥니다
  const { venueReviews, performerReviews } = useMemo(() => {
    const toReview = (r: ShowReview): Review => ({
      id: r.id,
      showId: showId ?? '',
      targetType: r.targetType === 'venue' ? 'venue' : 'performer',
      targetId: '',
      rating: r.rating,
      text: r.body,
      authorName: r.authorName,
      createdAt: r.createdAt,
    })
    return {
      venueReviews: reviews.data.filter((r) => r.targetType === 'venue').map(toReview),
      performerReviews: reviews.data.filter((r) => r.targetType === 'artist').map(toReview),
    }
  }, [reviews.data, showId])

  if (loading) {
    return (
      <Screen>
        <ScreenBody>
          <div className="h-56 animate-pulse rounded-2xl bg-surface-2" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-surface-2" />
        </ScreenBody>
      </Screen>
    )
  }

  if (!show || !place) {
    return (
      <Screen>
        <div className="flex items-center gap-2 px-4 pb-3 pt-12">
          <IconButton label="뒤로" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </IconButton>
        </div>
        <ScreenBody>
          <EmptyState
            art="search"
            title={error ? '공연을 불러오지 못했어요' : '공연을 찾을 수 없어요'}
            description={error ?? '취소되었거나 삭제된 공연일 수 있어요.'}
            action={
              error ? (
                <Button variant="outline" onClick={refresh}>
                  다시 시도
                </Button>
              ) : undefined
            }
          />
          <TabBarSpacer />
        </ScreenBody>
      </Screen>
    )
  }

  const isKopis = show.source === 'kopis'
  const liked = likes.data.includes(show.id)
  const following = performer ? follows.data.includes(performer.id) : false
  const mine = attendances.data.find((a) => a.showId === show.id)
  const going = mine?.status === 'going'
  const seatsLeft = Math.max(0, show.capacity - show.reservedCount)
  const soldOut = !isKopis && !going && seatsLeft <= 0

  const endedAt = new Date(show.startAt).getTime() + show.durationMin * 60_000
  const ended = endedAt < new Date(nowIso).getTime()
  const canReview = ended && !isKopis && !!mine && mine.status !== 'canceled'

  // 이미 등록했으면 그때 적은 인원을 기본값으로 씁니다
  const shownHeadcount = going ? (mine?.headcount ?? 1) : headcount

  const changeHeadcount = (n: number) => {
    setHeadcount(n)
    if (!going) return
    // 이미 등록한 상태에서 인원만 바꾸는 경우 — 바로 저장합니다
    requireAuth(async () => {
      const err = await setAttendance(show.id, n)
      if (err) {
        toast('인원을 바꾸지 못했어요', 'error', err)
        return
      }
      attendances.refresh()
      refresh()
    })
  }

  const toggleGoing = () =>
    requireAuth(async () => {
      setBusy(true)
      const err = going ? await cancelAttendance(show.id) : await setAttendance(show.id, headcount)
      setBusy(false)
      if (err) {
        toast('처리하지 못했어요', 'error', err)
        return
      }
      toast(
        going ? '참석 예정을 취소했어요' : '참석 예정으로 등록했어요',
        'success',
        going ? undefined : `${headcount}명으로 알려드렸어요`,
      )
      attendances.refresh()
      refresh()
    })

  return (
    <Screen>
      <div className="absolute left-3 top-11 z-30">
        <IconButton label="뒤로" onClick={() => navigate(-1)} className="bg-black/35 text-white">
          <ChevronLeft size={22} />
        </IconButton>
      </div>

      <ScreenBody padded={false} className="pb-28">
        <ShowDetailHero
          show={show}
          posterSeed={show.id + (performer?.photoSeed ?? show.title)}
          nowIso={nowIso}
          liked={liked}
          onToggleLike={() => requireAuth(() => void likes.toggle(show.id))}
        />

        {performer ? (
          <PerformerBlock
            artist={artist.data}
            loading={artist.loading}
            following={following}
            onToggleFollow={() => requireAuth(() => void follows.toggle(performer.id))}
          />
        ) : (
          <KopisCastBlock
            cast={show.kopisCast ?? '출연진 정보 없음'}
            genreLabel={show.genreLabel ?? show.kopisGenreLabel ?? show.genre ?? '분류 정보 없음'}
          />
        )}

        <VenueBlock place={place} genre={show.genre} distanceKm={meta?.distanceKm ?? 0} />

        <section className="px-4 py-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold">리뷰</h2>
            {canReview && (
              <Button
                size="sm"
                variant="outline"
                leading={<PenLine size={13} />}
                onClick={() => navigate(`/audience/review/${show.id}`)}
              >
                리뷰 쓰기
              </Button>
            )}
          </div>
          <ReviewTabs
            venueReviews={venueReviews}
            performerReviews={performerReviews}
            nowIso={nowIso}
            performerLabel={performer ? '공연' : '출연'}
          />
          {ended && !canReview && !isKopis && (
            <p className="mt-3 text-2xs leading-relaxed text-ink-3">
              리뷰는 참석 예정을 등록하고 실제로 다녀오신 분만 쓸 수 있어요. 그래야 별점이
              의미를 가집니다.
            </p>
          )}
        </section>

        {/* 신고 (§16). 눈에 잘 띄지 않게 두되 찾을 수 있는 자리에 둡니다 */}
        <button
          onClick={() => setReportOpen(true)}
          className="mx-auto mt-6 flex items-center gap-1.5 px-3 py-2 text-2xs font-semibold text-ink-3"
        >
          <Flag size={12} />
          이 공연 신고하기
        </button>

        <TabBarSpacer />
      </ScreenBody>

      <div className="absolute inset-x-0 bottom-0 z-40 border-t border-border bg-surface-1/95 px-4 pb-[calc(var(--safe-bottom)+14px)] pt-3 backdrop-blur-xl">
        <FreeTrialNotice className="mb-2.5" />
        {!isKopis && !ended && (
          <div className="mb-2.5 flex items-center gap-2">
            <span className="shrink-0 text-2xs font-bold text-ink-2">몇 분이 오시나요</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => changeHeadcount(n)}
                  className={`tnum h-7 w-9 rounded-lg border text-2xs font-bold transition-colors ${
                    shownHeadcount === n
                      ? 'bg-gold-500 border-transparent text-gold-ink'
                      : 'border-border bg-surface text-ink-2 active:bg-surface-2'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="tnum text-lg font-extrabold">
              {showPriceLabel(show.source, show.priceNote)}
            </p>
            <p className="tnum text-2xs text-ink-3">
              {isKopis
                ? '공연예술통합전산망(KOPIS) 제공'
                : ended
                  ? '종료된 공연'
                  : soldOut
                    ? '정원 마감'
                    : `${seatsLeft}석 남음`}
            </p>
          </div>
          {isKopis ? (
            // 등록 공연은 우리가 예매를 받지 않습니다. 원본 예매처로 보냅니다 —
            // 여기서 참석 예정을 받으면 실제 좌석과 어긋나 관객이 헛걸음합니다.
            <Button
              variant="brand"
              size="lg"
              disabled={!show.externalUrl}
              onClick={() => show.externalUrl && window.open(show.externalUrl, '_blank', 'noopener')}
              className="shrink-0"
            >
              예매처에서 보기
            </Button>
          ) : (
            <Button
              variant={going ? 'outline' : 'brand'}
              size="lg"
              loading={busy}
              disabled={ended || soldOut}
              onClick={toggleGoing}
              className="shrink-0"
            >
              {ended
                ? '종료되었어요'
                : going
                  ? '참석 취소'
                  : soldOut
                    ? '정원이 마감되었어요'
                    : '참석 예정'}
            </Button>
          )}
        </div>
      </div>
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="show"
        targetId={show.id}
      />
    </Screen>
  )
}
