import { useMemo, useState } from 'react'
import { Rating } from '@/components/ui/PosterArt'
import { Segmented } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { relativeFromNow } from '@/lib/datetime'
import { averageRating } from '@/store/selectors'
import type { Review, ReviewTarget } from '@/types'

/**
 * ★ 공간 리뷰와 공연 리뷰를 분리해 보여주는 탭.
 * 같은 공연이라도 "장소가 좋았다"와 "무대가 좋았다"는 다른 평가이므로
 * 절대 하나로 합치지 않습니다.
 */
export function ReviewTabs({
  venueReviews,
  performerReviews,
  nowIso,
  venueLabel = '공간',
  performerLabel = '공연',
}: {
  venueReviews: Review[]
  performerReviews: Review[]
  nowIso: string
  venueLabel?: string
  performerLabel?: string
}) {
  const [tab, setTab] = useState<ReviewTarget>('venue')

  const venueAvg = useMemo(() => averageRating(venueReviews.map((r) => r.rating)), [venueReviews])
  const performerAvg = useMemo(
    () => averageRating(performerReviews.map((r) => r.rating)),
    [performerReviews],
  )

  const list = tab === 'venue' ? venueReviews : performerReviews

  return (
    <div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'venue', label: `${venueLabel} 평점 (${venueReviews.length})` },
          { value: 'performer', label: `${performerLabel} 평점 (${performerReviews.length})` },
        ]}
      />

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-3">
        <span className="tnum text-2xl font-extrabold">
          {(tab === 'venue' ? venueAvg : performerAvg).toFixed(1)}
        </span>
        <div>
          <Rating value={tab === 'venue' ? venueAvg : performerAvg} size={13} />
          <p className="mt-0.5 text-2xs text-ink-3">
            {tab === 'venue'
              ? `이 ${venueLabel}에 대한 리뷰 ${venueReviews.length}건`
              : `이 ${performerLabel}에 대한 리뷰 ${performerReviews.length}건`}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {list.length === 0 ? (
          <EmptyState
            art="chat"
            title="아직 리뷰가 없어요"
            description="공연을 보고 나서 가장 먼저 후기를 남겨보세요."
          />
        ) : (
          list.map((r) => (
            <div key={r.id} className="border-b border-border pb-2.5 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{r.authorName}</span>
                  <Rating value={r.rating} size={11} />
                </div>
                <span className="tnum text-2xs text-ink-3">{relativeFromNow(r.createdAt, nowIso)}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{r.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
