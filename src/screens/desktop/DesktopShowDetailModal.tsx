import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useArtist } from '@/hooks/useArtist'
import { useAuthStore } from '@/hooks/useAuth'
import {
  cancelAttendance,
  setAttendance,
  useMyAttendances,
  useMyFollows,
  useMyLikes,
} from '@/hooks/useEngagement'
import { usePublicShow } from '@/hooks/usePublicShows'
import { useShowReviews, type ShowReview } from '@/hooks/useReviews'
import { showPriceLabel } from '@/lib/datetime'
import { KopisCastBlock, PerformerBlock } from '@/screens/audience/PerformerBlock'
import { ReviewTabs } from '@/screens/audience/ReviewTabs'
import { ShowDetailHero } from '@/screens/audience/ShowDetailHero'
import { VenueBlock } from '@/screens/audience/VenueBlock'
import { useNow } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Review } from '@/types'

/**
 * 데스크톱 전용 공연 상세 (§12).
 *
 * 지금 보던 목록·지도 맥락 위에 모달로 뜹니다. 모바일 화면과 같은 데이터를 읽고,
 * 참석 예정도 여기서 바로 처리합니다 — 예전에는 "예약은 모바일 앱에서"라며 새 탭을
 * 열었는데, 결제가 없는 지금은 굳이 화면을 옮길 이유가 없습니다.
 *
 * body 에 포털로 렌더링합니다. 지도(Leaflet)가 내부 pane 에 자체 스태킹 컨텍스트를
 * 만들어서, 목록·지도 레이아웃 안쪽에 얹으면 z-index 를 올려도 지도에 가려집니다.
 */
export function DesktopShowDetailModal({
  showId,
  onClose,
}: {
  showId: string | null
  onClose: () => void
}) {
  const nowIso = useNow()
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const { data: meta, loading, error, refresh } = usePublicShow(showId ?? undefined)
  const likes = useMyLikes()
  const follows = useMyFollows()
  const attendances = useMyAttendances()
  const reviews = useShowReviews(showId ?? undefined)
  const artist = useArtist(meta?.performer?.id)
  const [busy, setBusy] = useState(false)

  const open = showId !== null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const show = meta?.show ?? null
  const place = meta?.place ?? null
  const performer = meta?.performer ?? null

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

  if (!open) return null

  const isKopis = show?.source === 'kopis'
  const liked = show ? likes.data.includes(show.id) : false
  const following = performer ? follows.data.includes(performer.id) : false
  const mine = show ? attendances.data.find((a) => a.showId === show.id) : undefined
  const going = mine?.status === 'going'
  const seatsLeft = show ? Math.max(0, show.capacity - show.reservedCount) : 0
  const ended = show
    ? new Date(show.startAt).getTime() + show.durationMin * 60_000 < new Date(nowIso).getTime()
    : false
  const soldOut = !isKopis && !going && seatsLeft <= 0

  const toggleGoing = () => {
    if (!show) return
    requireAuth(async () => {
      setBusy(true)
      const err = going ? await cancelAttendance(show.id) : await setAttendance(show.id, 1)
      setBusy(false)
      if (err) {
        toast('처리하지 못했어요', 'error', err)
        return
      }
      toast(going ? '참석 예정을 취소했어요' : '참석 예정으로 등록했어요', 'success')
      attendances.refresh()
      refresh()
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <motion.button
        aria-label="닫기"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 42 }}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="tap absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="space-y-3 p-6">
            <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-16 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        ) : !show || !place ? (
          <div className="p-6">
            <EmptyState
              art="search"
              title={error ? '공연을 불러오지 못했어요' : '공연을 찾을 수 없어요'}
              description={error ?? '취소되었거나 삭제된 공연일 수 있어요.'}
            />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
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
                  genreLabel={
                    show.genreLabel ?? show.kopisGenreLabel ?? show.genre ?? '분류 정보 없음'
                  }
                />
              )}

              <VenueBlock place={place} genre={show.genre} distanceKm={meta?.distanceKm ?? 0} />

              <section className="px-4 py-5">
                <h2 className="mb-3 text-[15px] font-bold">리뷰</h2>
                <ReviewTabs
                  venueReviews={venueReviews}
                  performerReviews={performerReviews}
                  nowIso={nowIso}
                  performerLabel={performer ? '공연' : '출연'}
                />
              </section>
            </div>

            <div className="shrink-0 border-t border-border bg-surface-1 px-4 py-3.5">
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
                  <Button
                    variant="brand"
                    size="lg"
                    disabled={!show.externalUrl}
                    onClick={() =>
                      show.externalUrl && window.open(show.externalUrl, '_blank', 'noopener')
                    }
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
                    {ended ? '종료되었어요' : going ? '참석 취소' : soldOut ? '정원 마감' : '참석 예정'}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}
