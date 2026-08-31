import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '@/components/shell/ScreenHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Label, TextArea } from '@/components/ui/Field'
import { RatingInput } from '@/components/ui/PosterArt'
import { DEMO_AUDIENCE_NAME } from '@/config/brand'
import { resolvePlace } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/**
 * ★ 공간 리뷰와 공연 리뷰를 한 화면에서 쓰되, 항상 두 개의 별도 레코드로 저장합니다.
 * 등록 공연(KOPIS)은 우리 플랫폼에 등록된 공간·공연자 데이터가 없어 리뷰 작성 대상이 없습니다.
 */
export function ReviewCompose() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const addReview = useAppStore((s) => s.addReview)

  const show = shows.find((s) => s.id === showId) ?? null
  const place = show ? resolvePlace(show, venues) : null

  const [venueRating, setVenueRating] = useState(5)
  const [venueText, setVenueText] = useState('')
  const [performerRating, setPerformerRating] = useState(5)
  const [performerText, setPerformerText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!show || !place || show.source !== 'own' || !show.venueId || !show.performerId) {
    return (
      <Screen>
        <div className="flex items-center gap-2 px-4 pb-3 pt-12">
          <IconButton label="닫기" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </IconButton>
          <h1 className="text-[16px] font-bold">리뷰 작성</h1>
        </div>
        <EmptyState
          art="chat"
          title="리뷰를 작성할 수 없어요"
          description="등록 공연(KOPIS)은 우리 플랫폼에 등록된 공간·공연자 정보가 없어 리뷰를 남길 수 없습니다."
        />
      </Screen>
    )
  }

  const submit = () => {
    addReview({
      showId: show.id,
      targetType: 'venue',
      targetId: show.venueId as string,
      rating: venueRating,
      text: venueText.trim() || '좋은 공간이었어요.',
      authorName: DEMO_AUDIENCE_NAME,
    })
    addReview({
      showId: show.id,
      targetType: 'performer',
      targetId: show.performerId as string,
      rating: performerRating,
      text: performerText.trim() || '좋은 공연이었어요.',
      authorName: DEMO_AUDIENCE_NAME,
    })
    toast('리뷰가 등록되었습니다', 'success', '공간과 공연 평가가 각각 반영됩니다')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Screen>
        <div className="flex items-center gap-2 px-4 pb-3 pt-12">
          <IconButton label="닫기" onClick={() => navigate('/audience/my')}>
            <ChevronLeft size={22} />
          </IconButton>
          <h1 className="text-[16px] font-bold">리뷰 작성</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="bg-gold-500 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-gold-ink">
            ✓
          </div>
          <h2 className="mt-4 text-lg font-extrabold">리뷰가 등록되었어요</h2>
          <p className="mt-1.5 text-sm text-ink-2">
            공간 평점과 공연 평점이 각각 반영되었습니다.
          </p>
          <Button full variant="brand" size="lg" className="mt-6" onClick={() => navigate('/audience/my')}>
            마이 페이지로
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="flex items-center gap-2 border-b border-border px-4 pb-3 pt-12">
        <IconButton label="닫기" onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </IconButton>
        <div>
          <h1 className="text-[16px] font-bold">리뷰 작성</h1>
          <p className="text-2xs text-ink-3">{show.title}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <section>
          <h2 className="mb-1 text-[15px] font-bold">공간은 어땠나요?</h2>
          <p className="mb-3 text-xs text-ink-3">{place?.name} · 분위기, 좌석, 접근성 등</p>
          <RatingInput value={venueRating} onChange={setVenueRating} />
          <div className="mt-3">
            <Label>공간 후기</Label>
            <TextArea
              rows={3}
              value={venueText}
              onChange={(e) => setVenueText(e.target.value)}
              placeholder="공간에 대한 솔직한 후기를 남겨주세요"
            />
          </div>
        </section>

        <div className="divider" />

        <section>
          <h2 className="mb-1 text-[15px] font-bold">공연은 어땠나요?</h2>
          <p className="mb-3 text-xs text-ink-3">무대, 연출, 완성도 등</p>
          <RatingInput value={performerRating} onChange={setPerformerRating} />
          <div className="mt-3">
            <Label>공연 후기</Label>
            <TextArea
              rows={3}
              value={performerText}
              onChange={(e) => setPerformerText(e.target.value)}
              placeholder="공연에 대한 솔직한 후기를 남겨주세요"
            />
          </div>
        </section>
      </div>

      <div className="border-t border-border px-4 pb-[calc(var(--safe-bottom)+14px)] pt-3">
        <Button full variant="brand" size="lg" onClick={submit}>
          리뷰 등록하기
        </Button>
      </div>
    </Screen>
  )
}
