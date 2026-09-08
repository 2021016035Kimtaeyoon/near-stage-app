import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isShowOver } from '@/lib/datetime'
import { Screen } from '@/components/shell/ScreenHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Label, TextArea } from '@/components/ui/Field'
import { RatingInput } from '@/components/ui/PosterArt'
import { useMyAttendances } from '@/hooks/useEngagement'
import { usePublicShow } from '@/hooks/usePublicShows'
import { submitReview } from '@/hooks/useReviews'
import { useNow } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/**
 * 리뷰 작성 (§12).
 *
 * ★ 공간 리뷰와 공연 리뷰를 한 화면에서 쓰되 항상 두 개의 별도 레코드로 저장합니다.
 *   "장소가 좋았다"와 "무대가 좋았다"는 다른 평가라서 합치면 둘 다 못 믿게 됩니다.
 *
 * ★ 쓸 수 있는지는 DB 가 최종 판단합니다 — 공연이 실제로 끝났고 참석한 사람만
 *   통과합니다(0012). 여기 가드는 헛걸음을 줄이려는 것이지 보안이 아닙니다.
 */
export function ReviewCompose() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const nowIso = useNow()
  const { data: meta, loading } = usePublicShow(showId)
  const attendances = useMyAttendances()

  const [venueRating, setVenueRating] = useState(5)
  const [venueText, setVenueText] = useState('')
  const [performerRating, setPerformerRating] = useState(5)
  const [performerText, setPerformerText] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const show = meta?.show ?? null
  const place = meta?.place ?? null
  const mine = attendances.data.find((a) => a.showId === showId)
  const ended = show ? isShowOver(show, nowIso) : false

  const header = (title: string, onBack: () => void) => (
    <div className="flex items-center gap-2 border-b border-border px-4 pb-3 pt-12">
      <IconButton label="닫기" onClick={onBack}>
        <ChevronLeft size={22} />
      </IconButton>
      <div className="min-w-0">
        <h1 className="text-[16px] font-bold">리뷰 작성</h1>
        {title && <p className="truncate text-2xs text-ink-3">{title}</p>}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Screen>
        {header('', () => navigate(-1))}
        <div className="p-4">
          <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      </Screen>
    )
  }

  const blocked = !show
    ? { title: '공연을 찾을 수 없어요', desc: '취소되었거나 삭제된 공연일 수 있어요.' }
    : show.source !== 'own'
      ? {
          title: '리뷰를 쓸 수 없는 공연이에요',
          desc: '등록 공연(KOPIS)은 우리 플랫폼에 등록된 공간·아티스트 정보가 없어 평점을 남길 대상이 없습니다.',
        }
      : !ended
        ? {
            title: '아직 공연 전이에요',
            desc: '공연이 끝난 뒤에 리뷰를 쓸 수 있어요. 안 본 공연에 별점이 달리면 별점을 아무도 안 믿게 됩니다.',
          }
        : !mine || mine.status === 'canceled'
          ? {
              title: '참석하신 분만 쓸 수 있어요',
              desc: '이 공연에 참석 예정을 등록한 기록이 없습니다. 다녀오신 게 맞다면 호스트에게 문의해주세요.',
            }
          : null

  if (blocked) {
    return (
      <Screen>
        {header(show?.title ?? '', () => navigate(-1))}
        <EmptyState art="chat" title={blocked.title} description={blocked.desc} />
      </Screen>
    )
  }

  const submit = async () => {
    if (!show) return
    setBusy(true)
    const errs = [
      await submitReview({
        showId: show.id,
        targetType: 'venue',
        rating: venueRating,
        body: venueText.trim(),
      }),
      await submitReview({
        showId: show.id,
        targetType: 'artist',
        rating: performerRating,
        body: performerText.trim(),
      }),
    ].filter(Boolean)
    setBusy(false)
    if (errs.length > 0) {
      toast('등록하지 못했어요', 'error', errs[0] ?? undefined)
      return
    }
    toast('리뷰를 남겼어요', 'success', '공간 평점과 공연 평점에 각각 반영됩니다')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Screen>
        {header(show?.title ?? '', () => navigate('/audience/my'))}
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="bg-gold-500 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-gold-ink">
            ✓
          </div>
          <h2 className="mt-4 text-lg font-extrabold">리뷰를 남겼어요</h2>
          <p className="mt-1.5 text-sm text-ink-2">공간 평점과 공연 평점에 각각 반영되었습니다.</p>
          <Button
            full
            variant="brand"
            size="lg"
            className="mt-6"
            onClick={() => navigate(`/audience/show/${show?.id}`)}
          >
            공연 화면으로
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      {header(show?.title ?? '', () => navigate(-1))}

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <section>
          <h2 className="mb-1 text-[15px] font-bold">공간은 어땠나요?</h2>
          <p className="mb-3 text-xs text-ink-3">{place?.name} · 분위기, 좌석, 접근성 등</p>
          <RatingInput value={venueRating} onChange={setVenueRating} />
          <div className="mt-3">
            <Label hint="비워도 별점은 저장됩니다">공간 후기</Label>
            <TextArea
              rows={3}
              value={venueText}
              onChange={(e) => setVenueText(e.target.value)}
              placeholder="공간에 대한 솔직한 후기를 남겨주세요"
              maxLength={500}
            />
          </div>
        </section>

        <div className="divider" />

        <section>
          <h2 className="mb-1 text-[15px] font-bold">공연은 어땠나요?</h2>
          <p className="mb-3 text-xs text-ink-3">
            {meta?.performer?.teamName ?? '무대'} · 연출, 완성도 등
          </p>
          <RatingInput value={performerRating} onChange={setPerformerRating} />
          <div className="mt-3">
            <Label hint="비워도 별점은 저장됩니다">공연 후기</Label>
            <TextArea
              rows={3}
              value={performerText}
              onChange={(e) => setPerformerText(e.target.value)}
              placeholder="공연에 대한 솔직한 후기를 남겨주세요"
              maxLength={500}
            />
          </div>
        </section>

        <p className="text-2xs leading-relaxed text-ink-3">
          리뷰는 이름과 함께 공개됩니다. 이미 쓰신 리뷰가 있으면 이번 내용으로 바뀝니다.
        </p>
      </div>

      <div className="border-t border-border px-4 pb-[calc(var(--safe-bottom)+14px)] pt-3">
        <Button full variant="brand" size="lg" loading={busy} onClick={() => void submit()}>
          리뷰 등록하기
        </Button>
      </div>
    </Screen>
  )
}
