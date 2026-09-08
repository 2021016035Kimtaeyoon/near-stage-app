import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApplicants } from '@/hooks/useApplications'
import { priceLabel } from '@/lib/datetime'
import type { VenueEquipment } from '@/lib/needMatch'
import { describeDbError, supabase } from '@/lib/supabase'
import { ApplicantCard } from './ApplicantCard'

interface PostHead {
  id: string
  message: string
  wantedGenres: string[]
  dateFrom: string
  dateTo: string
  offerFee: number
  status: 'open' | 'closed'
  venueId: string
  venueName: string
  equipment: VenueEquipment
}

/**
 * 지원자 목록 (§10).
 *
 * 구인글 정보를 따로 한 번 더 읽습니다. 목록 화면을 거치지 않고 알림에서 바로
 * 들어오는 경로가 있어서, 앞 화면이 넘겨준 값에 기대면 그때 빈 화면이 뜹니다.
 */
export function OwnerApplicantsScreen() {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const applicants = useApplicants(postId)

  const [post, setPost] = useState<PostHead | null>(null)
  const [headError, setHeadError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) return
    let alive = true
    void supabase
      .from('posts')
      .select(
        'id,message,wanted_genres,date_from,date_to,offer_fee,status,venue_id,venues!posts_venue_id_fkey(name,equipment)',
      )
      .eq('id', postId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          setHeadError(describeDbError(error))
          return
        }
        if (!data) {
          setHeadError(null)
          setPost(null)
          return
        }
        type V = { name: string; equipment: VenueEquipment | null }
        const v = (Array.isArray(data.venues) ? data.venues[0] : data.venues) as V | null
        setPost({
          id: data.id,
          message: data.message ?? '',
          wantedGenres: data.wanted_genres ?? [],
          dateFrom: data.date_from,
          dateTo: data.date_to,
          offerFee: data.offer_fee,
          status: data.status,
          venueId: data.venue_id,
          venueName: v?.name ?? '',
          equipment: v?.equipment ?? {},
        })
      })
    return () => {
      alive = false
    }
  }, [postId])

  if (headError) {
    return (
      <Screen>
        <ScreenHeader title="지원자" back />
        <ScreenBody>
          <EmptyState art="search" title="불러오지 못했어요" description={headError} />
        </ScreenBody>
      </Screen>
    )
  }

  const pending = applicants.data.filter((a) => a.status === 'pending')
  const decided = applicants.data.filter((a) => a.status !== 'pending')

  return (
    <Screen>
      <ScreenHeader title="지원자" subtitle={post?.venueName} back />
      <ScreenBody>
        {post && (
          <div className="card mb-4 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {post.wantedGenres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border px-1.5 py-0.5 text-2xs font-semibold text-ink-2"
                  >
                    {g}
                  </span>
                ))}
              </div>
              {post.status === 'closed' && <Tag>마감</Tag>}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{post.message}</p>
            <p className="tnum mt-1.5 text-2xs text-ink-3">
              {post.offerFee === 0 ? '개런티 협의' : priceLabel(post.offerFee)} · 플랫폼은 대금에
              관여하지 않습니다
            </p>
          </div>
        )}

        {applicants.loading ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : applicants.error ? (
          <EmptyState
            art="search"
            title="불러오지 못했어요"
            description={applicants.error}
            action={
              <Button variant="outline" onClick={applicants.refresh}>
                다시 시도
              </Button>
            }
          />
        ) : applicants.data.length === 0 ? (
          <EmptyState
            art="search"
            title="아직 지원자가 없어요"
            description="가능 시간을 더 열어두면 지원이 늘어납니다. 영상이 있는 팀은 조건을 보고 먼저 연락하기도 합니다."
            action={
              post && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/host/venue/${post.venueId}/slots`)}
                >
                  가능 시간 열기
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <ApplicantCard
                key={a.id}
                applicant={a}
                equipment={post?.equipment ?? {}}
                onDone={applicants.refresh}
              />
            ))}
            {decided.length > 0 && (
              <>
                <p className="pt-2 text-2xs font-bold text-ink-3">처리한 지원 {decided.length}건</p>
                {decided.map((a) => (
                  <ApplicantCard
                    key={a.id}
                    applicant={a}
                    equipment={post?.equipment ?? {}}
                    onDone={applicants.refresh}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
