import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChevronLeft } from 'lucide-react'
import { DEFAULT_USER_LOCATION } from '@/config/brand'
import { priceLabel } from '@/lib/datetime'
import { distanceKm as calcDistance } from '@/lib/geo'
import { resolvePlace } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { KopisCastBlock, PerformerBlock } from './PerformerBlock'
import { ReviewTabs } from './ReviewTabs'
import { ShowDetailHero } from './ShowDetailHero'
import { VenueBlock } from './VenueBlock'

export function ShowDetail() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()

  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const reviews = useAppStore((s) => s.reviews)
  const nowIso = useAppStore((s) => s.demoNowIso)
  const likedShowIds = useAppStore((s) => s.likedShowIds)
  const followedPerformerIds = useAppStore((s) => s.followedPerformerIds)
  const toggleLike = useAppStore((s) => s.toggleLike)
  const toggleFollow = useAppStore((s) => s.toggleFollow)
  const addRecentlyViewedShow = useAppStore((s) => s.addRecentlyViewedShow)

  const show = shows.find((s) => s.id === showId) ?? null

  useEffect(() => {
    if (showId) addRecentlyViewedShow(showId)
  }, [showId, addRecentlyViewedShow])
  const place = show ? resolvePlace(show, venues) : null
  const performer = show?.performerId
    ? (performers.find((p) => p.id === show.performerId) ?? null)
    : null
  const venue = show?.venueId ? (venues.find((v) => v.id === show.venueId) ?? null) : null

  const venueReviews = useMemo(
    () =>
      show
        ? reviews.filter((r) => r.targetType === 'venue' && r.targetId === (show.venueId ?? ''))
        : [],
    [reviews, show],
  )
  const performerReviews = useMemo(
    () =>
      show
        ? reviews.filter(
            (r) => r.targetType === 'performer' && r.targetId === (show.performerId ?? ''),
          )
        : [],
    [reviews, show],
  )

  if (!show || !place) {
    return (
      <Screen>
        <div className="flex items-center gap-2 px-4 pb-3 pt-12">
          <IconButton label="뒤로" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </IconButton>
        </div>
        <ScreenBody>
          <EmptyState art="search" title="공연을 찾을 수 없어요" description="이미 종료되었거나 삭제된 공연일 수 있어요." />
          <TabBarSpacer />
        </ScreenBody>
      </Screen>
    )
  }

  const dist = calcDistance(DEFAULT_USER_LOCATION, { lat: place.lat, lng: place.lng })
  const liked = likedShowIds.includes(show.id)
  const following = performer ? followedPerformerIds.includes(performer.id) : false
  const seatsLeft = Math.max(0, show.capacity - show.reservedCount)
  const soldOut = seatsLeft <= 0

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
          onToggleLike={() => toggleLike(show.id)}
        />

        {performer ? (
          <PerformerBlock
            performer={performer}
            following={following}
            onToggleFollow={() => toggleFollow(performer.id)}
          />
        ) : (
          <KopisCastBlock cast={show.kopisCast ?? '출연진 정보 없음'} genreLabel={show.kopisGenreLabel ?? show.genre} />
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

        <TabBarSpacer />
      </ScreenBody>

      <div className="absolute inset-x-0 bottom-0 z-40 border-t border-border bg-surface-1/95 px-4 pb-[calc(var(--safe-bottom)+14px)] pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="tnum text-lg font-extrabold">{priceLabel(show.ticketPrice)}</p>
            <p className="tnum text-2xs text-ink-3">
              {soldOut ? '매진' : `${seatsLeft}석 남음`} · 예약금 1,000원
            </p>
          </div>
          <Button
            variant="brand"
            size="lg"
            disabled={soldOut}
            onClick={() => navigate(`/audience/book/${show.id}`)}
            className="shrink-0"
          >
            {soldOut ? '매진되었습니다' : '예약하기 · 예약금 1,000원'}
          </Button>
        </div>
      </div>
    </Screen>
  )
}
