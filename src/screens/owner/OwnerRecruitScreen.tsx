import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyVenues } from '@/hooks/useMyResources'
import { setPostStatus, useMyPosts, type MyPost } from '@/hooks/usePosts'
import { priceLabel } from '@/lib/datetime'
import { toast } from '@/store/useToast'
import { CreatePostSheet } from './CreatePostSheet'

/**
 * 구인글 목록 (§10).
 *
 * 승인된 공간이 없으면 구인글을 올릴 수 없습니다 — 공개되지 않은 공간의 구인글은
 * 아티스트에게 보이지 않아서(RLS 가 조인을 비웁니다) 올려도 아무 일이 안 일어납니다.
 * 그래서 그 경우에는 구인 폼 대신 등록·심사 안내를 보여줍니다.
 */
export function OwnerRecruitScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const venues = useMyVenues()
  const approved = venues.data.filter((v) => v.status === 'approved')
  const posts = useMyPosts(approved.map((v) => v.id))
  const [createOpen, setCreateOpen] = useState(false)

  const canPost = approved.length > 0

  return (
    <Screen>
      <ScreenHeader
        title="구인 & 지원자"
        right={
          canPost ? (
            <Button
              size="sm"
              variant="brand"
              leading={<Plus size={14} />}
              onClick={() => setCreateOpen(true)}
            >
              구인글
            </Button>
          ) : undefined
        }
      />
      <ScreenBody>
        {!userId ? (
          <EmptyState
            art="stage"
            title="로그인하면 구인글을 올릴 수 있어요"
            description="가게를 등록하고 원하는 팀을 적어두면 아티스트가 지원합니다."
            action={
              <Button variant="brand" onClick={() => requireAuth(() => navigate('/host/venue'))}>
                시작하기
              </Button>
            }
          />
        ) : venues.loading || posts.loading ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : venues.data.length === 0 ? (
          <EmptyState
            art="stage"
            title="먼저 가게를 등록해주세요"
            description="공간이 있어야 구인글을 올릴 수 있습니다."
            action={
              <Button variant="brand" onClick={() => navigate('/host/venue/new')}>
                우리 가게 등록하기
              </Button>
            }
          />
        ) : !canPost ? (
          <EmptyState
            art="search"
            title="공간이 아직 공개 전이에요"
            description="공개된 공간의 구인글만 아티스트에게 보입니다. 심사 상태를 확인해주세요."
            action={
              <Button variant="outline" onClick={() => navigate('/host/venue')}>
                내 공간 보기
              </Button>
            }
          />
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
            title="올린 구인글이 없어요"
            description="원하는 장르와 조건을 적어두면 아티스트가 지원합니다."
            action={
              <Button variant="brand" onClick={() => setCreateOpen(true)}>
                첫 구인글 올리기
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {posts.data.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                venueName={approved.find((v) => v.id === p.venueId)?.name ?? ''}
                showVenue={approved.length > 1}
                onOpen={() => navigate(`/owner/applicants/${p.id}`)}
                onDone={posts.refresh}
              />
            ))}
          </div>
        )}

        <TabBarSpacer />
      </ScreenBody>

      <CreatePostSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        venues={approved}
        onDone={posts.refresh}
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

function PostRow({
  post,
  venueName,
  showVenue,
  onOpen,
  onDone,
}: {
  post: MyPost
  venueName: string
  showVenue: boolean
  onOpen: () => void
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const closed = post.status === 'closed'

  const toggle = async () => {
    setBusy(true)
    const err = await setPostStatus(post.id, closed ? 'open' : 'closed')
    setBusy(false)
    if (err) {
      toast('바꾸지 못했어요', 'error', err)
      return
    }
    toast(closed ? '다시 모집합니다' : '모집을 마감했어요')
    onDone()
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={onOpen} className="w-full p-3.5 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {post.wantedGenres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full border border-border px-1.5 py-0.5 text-2xs font-semibold text-ink-2"
              >
                {g}
              </span>
            ))}
            {post.wantedGenres.length > 3 && (
              <span className="text-2xs text-ink-3">외 {post.wantedGenres.length - 3}</span>
            )}
          </div>
          {closed ? (
            <Tag>마감</Tag>
          ) : post.pendingCount > 0 ? (
            <Tag tone="warn">대기 {post.pendingCount}</Tag>
          ) : (
            <Tag tone="ok">모집중</Tag>
          )}
        </div>

        {showVenue && <p className="mt-1.5 text-2xs font-semibold text-ink-3">{venueName}</p>}
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{post.message}</p>
        <p className="tnum mt-2 text-2xs text-ink-3">
          {dateRange(post.dateFrom, post.dateTo)} ·{' '}
          {post.offerFee === 0 ? '개런티 협의' : priceLabel(post.offerFee)} · 지원{' '}
          {post.applicationCount}건
        </p>
      </button>

      <div className="flex gap-2 border-t border-border px-3.5 py-2.5">
        <Button size="sm" variant="outline" loading={busy} onClick={() => void toggle()}>
          {closed ? '다시 모집' : '모집 마감'}
        </Button>
        <Button size="sm" variant="ghost" full onClick={onOpen}>
          지원자 {post.applicationCount}명 보기
        </Button>
      </div>
    </div>
  )
}
