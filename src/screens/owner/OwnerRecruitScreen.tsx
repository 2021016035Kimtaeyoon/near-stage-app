import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { GenreTag, Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { humanDate, priceLabel } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'
import { CreatePostSheet } from './CreatePostSheet'

export function OwnerRecruitScreen() {
  const navigate = useNavigate()
  const venueId = useAppStore((s) => s.currentVenueId)
  const posts = useAppStore((s) => s.posts.filter((p) => p.venueId === venueId))
  const nowIso = useAppStore((s) => s.demoNowIso)
  const [createOpen, setCreateOpen] = useState(false)

  const sorted = posts
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <Screen>
      <ScreenHeader
        title="구인 & 지원자"
        right={
          <Button size="sm" variant="brand" leading={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
            구인글
          </Button>
        }
      />
      <ScreenBody>
        {sorted.length === 0 ? (
          <EmptyState
            art="stage"
            title="등록된 구인글이 없어요"
            description="원하는 장르와 조건을 알려주면 공연자가 지원할 수 있어요."
            action={
              <Button variant="brand" onClick={() => setCreateOpen(true)}>
                첫 구인글 등록하기
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {sorted.map((post) => {
              const pending = post.applications.filter((a) => a.status === '대기').length
              return (
                <button
                  key={post.id}
                  onClick={() => navigate(`/owner/applicants/${post.id}`)}
                  className="card w-full p-3.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.wantedGenres.map((g) => (
                        <GenreTag key={g} genre={g} size="sm" />
                      ))}
                    </div>
                    {post.closed ? (
                      <Tag tone="ok">마감</Tag>
                    ) : pending > 0 ? (
                      <Tag tone="warn">대기 {pending}명</Tag>
                    ) : (
                      <Tag>모집중</Tag>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-2">
                    {post.message}
                  </p>
                  <div className="tnum mt-2 flex items-center justify-between text-2xs text-ink-3">
                    <span>
                      {post.offerFee === 0 ? '수익 배분' : priceLabel(post.offerFee)} · 지원{' '}
                      {post.applications.length}건
                    </span>
                    <span>{humanDate(post.createdAt, nowIso)} 등록</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        <TabBarSpacer />
      </ScreenBody>

      <CreatePostSheet open={createOpen} onClose={() => setCreateOpen(false)} venueId={venueId} />
    </Screen>
  )
}
