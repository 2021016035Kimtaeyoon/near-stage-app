import { CheckCircle2, MapPin, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMyApplications } from '@/hooks/useApplications'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyArtists } from '@/hooks/useMyResources'
import { useOpenPosts, type OpenPost } from '@/hooks/usePosts'
import { priceLabel } from '@/lib/datetime'
import { matchNeeds } from '@/lib/needMatch'
import { ApplyToPostSheet } from './ApplyToPostSheet'

type Tab = 'open' | 'mine'

/**
 * 구인글 찾기 + 내 지원 현황 (§10).
 *
 * ★ 목록에서 이미 장비 대조를 해서 보여줍니다. 열어봐야 알 수 있으면 아티스트가
 *   전부 열어보게 되고, 그러면 아무도 안 봅니다.
 */
export function PerformerPostsScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const artists = useMyArtists()
  const approved = artists.data.filter((a) => a.status === 'approved')
  const posts = useOpenPosts()
  const mine = useMyApplications(approved.map((a) => a.id))

  const [tab, setTab] = useState<Tab>('open')
  const [target, setTarget] = useState<OpenPost | null>(null)

  // 이미 지원한 글은 다시 지원할 수 없습니다 (DB 도 UNIQUE 로 막습니다)
  const appliedPostIds = new Set(mine.data.map((m) => m.post?.id).filter(Boolean) as string[])
  const needsByArtist: Record<string, string[]> = {}
  for (const a of approved) needsByArtist[a.id] = a.needs

  // 대조에 쓸 기준 팀 — 여러 팀이면 첫 번째 팀 기준으로 미리 보여줍니다
  const baseNeeds = approved[0]?.needs ?? []

  const openApply = (p: OpenPost) => {
    requireAuth(() => {
      if (approved.length === 0) {
        navigate('/artist/me')
        return
      }
      setTarget(p)
    })
  }

  return (
    <Screen>
      <ScreenHeader title="구인 · 지원" subtitle="설 무대를 찾습니다" />
      <ScreenBody>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'open', label: `구인글 ${posts.data.length}` },
            { value: 'mine', label: `내 지원 ${mine.data.length}` },
          ]}
        />

        <div className="mt-4">
          {tab === 'open' ? (
            posts.loading ? (
              <div className="space-y-2.5">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-2" />
                ))}
              </div>
            ) : posts.error ? (
              <EmptyState
                art="search"
                title="불러오지 못했어요"
                description={posts.error}
                action={
                  <Button variant="outline" onClick={posts.refresh}>
                    다시 시도
                  </Button>
                }
              />
            ) : posts.data.length === 0 ? (
              <EmptyState
                art="stage"
                title="지금 올라온 구인글이 없어요"
                description="공간이 구인글을 올리면 여기에 바로 뜹니다. 팀 소개와 영상을 채워두면 호스트가 먼저 연락하기도 합니다."
                action={
                  <Button variant="outline" onClick={() => navigate('/artist/me')}>
                    내 팀 다듬기
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {posts.data.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    needs={baseNeeds}
                    applied={appliedPostIds.has(p.id)}
                    onApply={() => openApply(p)}
                  />
                ))}
              </div>
            )
          ) : !userId ? (
            <EmptyState
              art="search"
              title="로그인하면 지원 현황을 볼 수 있어요"
              description="지원한 글과 호스트의 답을 여기서 확인합니다."
            />
          ) : mine.data.length === 0 ? (
            <EmptyState
              art="search"
              title="아직 지원한 곳이 없어요"
              description="구인글 탭에서 조건이 맞는 공간에 지원해보세요."
            />
          ) : (
            <div className="space-y-2.5">
              {mine.data.map((m) => (
                <div key={m.id} className="card p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {m.post?.venueName ?? '삭제된 구인글'}
                    </span>
                    <Tag
                      tone={
                        m.status === 'accepted' ? 'ok' : m.status === 'rejected' ? 'danger' : 'warn'
                      }
                    >
                      {m.status === 'accepted' ? '수락' : m.status === 'rejected' ? '거절' : '대기'}
                    </Tag>
                  </div>
                  {m.post && (
                    <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-ink-3">
                      {m.post.message}
                    </p>
                  )}
                  <p className="mt-1.5 rounded-lg bg-surface-2 p-2 text-2xs leading-relaxed text-ink-2">
                    “{m.message}”
                  </p>
                  {m.rejectReason && (
                    <p className="mt-1.5 text-2xs text-danger">거절 사유: {m.rejectReason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>

      <ApplyToPostSheet
        open={!!target}
        onClose={() => setTarget(null)}
        post={target}
        artists={approved}
        needs={needsByArtist}
        onDone={() => {
          mine.refresh()
          posts.refresh()
        }}
      />
    </Screen>
  )
}

function dateRange(from: string, to: string): string {
  const f = new Date(from)
  const t = new Date(to)
  const fs = `${f.getMonth() + 1}.${f.getDate()}`
  const ts = `${t.getMonth() + 1}.${t.getDate()}`
  return fs === ts ? fs : `${fs} – ${ts}`
}

function PostCard({
  post,
  needs,
  applied,
  onApply,
}: {
  post: OpenPost
  needs: string[]
  applied: boolean
  onApply: () => void
}) {
  const match = matchNeeds(needs, post.venue.equipment)
  const allOk = match.judgedCount > 0 && match.missingCount === 0

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-3 p-3.5">
        {post.venue.photos[0] ? (
          <img
            src={post.venue.photos[0]}
            alt=""
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
            <MapPin size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{post.venue.name}</span>
            {applied && <Tag tone="ok">지원함</Tag>}
          </div>
          <p className="mt-0.5 text-2xs text-ink-2">
            {post.venue.category} · 최대 {post.venue.capacity}명
          </p>
          <p className="mt-0.5 truncate text-2xs text-ink-3">{post.venue.address}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {post.wantedGenres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full border border-border px-1.5 py-0.5 text-2xs font-semibold text-ink-2"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-3.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{post.message}</p>

      <p className="tnum mx-3.5 mt-2 text-2xs text-ink-3">
        {dateRange(post.dateFrom, post.dateTo)} ·{' '}
        {post.offerFee === 0 ? '개런티 협의' : priceLabel(post.offerFee)}
      </p>

      {needs.length > 0 && (
        <p
          className={`mx-3.5 mt-2 flex items-center gap-1 text-2xs font-semibold ${
            allOk ? 'text-ok' : match.missingCount > 0 ? 'text-warn' : 'text-ink-3'
          }`}
        >
          {allOk ? <CheckCircle2 size={12} /> : <TriangleAlert size={12} />}
          {allOk
            ? '우리 팀 조건을 모두 만족하는 공간이에요'
            : match.missingCount > 0
              ? `장비 ${match.missingCount}개가 부족합니다`
              : '조건을 확인해보세요'}
        </p>
      )}

      <div className="mt-3 border-t border-border p-3">
        <Button variant={applied ? 'outline' : 'brand'} full disabled={applied} onClick={onApply}>
          {applied ? '이미 지원한 곳이에요' : '지원하기'}
        </Button>
      </div>
    </div>
  )
}
