import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { KopisCastBlock, PerformerBlock } from '@/screens/audience/PerformerBlock'
import { ReviewTabs } from '@/screens/audience/ReviewTabs'
import { ShowDetailHero } from '@/screens/audience/ShowDetailHero'
import { VenueBlock } from '@/screens/audience/VenueBlock'
import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { priceLabel } from '@/lib/datetime'
import { distanceKm as calcDistance } from '@/lib/geo'
import { resolvePlace } from '@/store/selectors'
import { useAppStore, useNow } from '@/store/useAppStore'

/**
 * 데스크톱 전용 공연 상세 — 모바일 화면(`/audience/show/:id`)으로 새 탭이 열리지 않고
 * 지금 보던 목록·지도 맥락 위에 모달로 뜹니다. 예약만은 아직 데스크톱 결제 플로우가
 * 없어 모바일 프로토타입을 새 탭으로 열어 이어갑니다(합리적 기본값).
 *
 * body에 포털로 렌더링합니다. 지도(Leaflet)가 내부 pane에 자체 z-index/스태킹 컨텍스트를
 * 만들어서, 목록·지도 레이아웃 안쪽에 absolute로 얹으면 z-index를 아무리 올려도 지도한테
 * 가려지는 경우가 있었습니다(모달 DOM은 있는데 화면엔 안 보이던 버그).
 */
export function DesktopShowDetailModal({
  showId,
  onClose,
}: {
  showId: string | null
  onClose: () => void
}) {
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const reviews = useAppStore((s) => s.reviews)
  const nowIso = useNow()
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const toggleLike = useAppStore((s) => s.toggleLike)
  const toggleFollow = useAppStore((s) => s.toggleFollow)

  const open = showId !== null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const show = showId ? (shows.find((s) => s.id === showId) ?? null) : null
  const place = show ? resolvePlace(show, venues) : null
  const performer = show?.performerId
    ? (performers.find((p) => p.id === show.performerId) ?? null)
    : null
  const venue = show?.venueId ? (venues.find((v) => v.id === show.venueId) ?? null) : null

  const venueReviews = useMemo(
    () =>
      show ? reviews.filter((r) => r.targetType === 'venue' && r.targetId === (show.venueId ?? '')) : [],
    [reviews, show],
  )
  const performerReviews = useMemo(
    () =>
      show
        ? reviews.filter((r) => r.targetType === 'performer' && r.targetId === (show.performerId ?? ''))
        : [],
    [reviews, show],
  )

  const dist = place ? calcDistance(DEFAULT_USER_LOCATION, { lat: place.lat, lng: place.lng }) : 0
  const liked = show ? likedShowIds.includes(show.id) : false
  const following = performer ? followedPerformerIds.includes(performer.id) : false
  const seatsLeft = show ? Math.max(0, show.capacity - show.reservedCount) : 0
  const soldOut = seatsLeft <= 0

  if (!open) return null

  return createPortal(
    <>
      {(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" role="dialog" aria-modal="true">
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

            {!show || !place ? (
              <div className="p-6">
                <EmptyState art="search" title="공연을 찾을 수 없어요" description="이미 종료되었거나 삭제된 공연일 수 있어요." />
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ShowDetailHero
                    show={show}
                    posterSeed={show.id + (performer?.photoSeed ?? show.title)}
                    nowIso={nowIso}
                    liked={liked}
                    onToggleLike={() => toggleLike(show.id)}
                  />

                  {performer ? (
                    <PerformerBlock
                      performer={performer}
                      following={following}
                      onToggleFollow={() => toggleFollow(performer.id)}
                    />
                  ) : (
                    <KopisCastBlock cast={show.kopisCast ?? '출연진 정보 없음'} genreLabel={show.genreLabel ?? show.kopisGenreLabel ?? show.genre ?? '분류 정보 없음'} />
                  )}

                  <VenueBlock
                    place={place}
                    genre={show.genre}
                    distanceKm={dist}
                    own={venue ? { rating: venue.rating, reviewCount: venue.reviewCount, isContracted: venue.isContracted } : undefined}
                  />

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
                      <p className="tnum text-lg font-extrabold">{priceLabel(show.ticketPrice)}</p>
                      <p className="tnum text-2xs text-ink-3">
                        {soldOut ? '매진' : `${seatsLeft}석 남음`} · 예약은 모바일 앱에서 진행돼요
                      </p>
                    </div>
                    <Button
                      variant="brand"
                      size="lg"
                      disabled={soldOut}
                      onClick={() =>
                        window.open(`${location.pathname}#/audience/show/${show.id}`, '_blank', 'noopener')
                      }
                      className="shrink-0"
                    >
                      {soldOut ? '매진되었습니다' : '예약하기'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>,
    document.body,
  )
}
