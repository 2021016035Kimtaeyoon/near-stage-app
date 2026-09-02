import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { GenreTag, Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { humanDate, priceLabel, won } from '@/lib/datetime'
import { useAppStore } from '@/store/useAppStore'
import type { Post } from '@/types'
import { ApplyToPostSheet } from './ApplyToPostSheet'
import { CreateBidSheet } from './CreateBidSheet'

type Tab = 'posts' | 'bids'

export function PerformerPostsScreen() {
  const [tab, setTab] = useState<Tab>('posts')
  const performerId = useAppStore((s) => s.currentPerformerId)
  const posts = useAppStore((s) => s.posts)
  const venues = useAppStore((s) => s.venues)
  const bids = useAppStore((s) => s.reverseBids.filter((b) => b.performerId === performerId))
  const nowIso = useAppStore((s) => s.demoNowIso)

  const [applyTarget, setApplyTarget] = useState<Post | null>(null)
  const [bidSheetOpen, setBidSheetOpen] = useState(false)

  const openPosts = posts.filter((p) => !p.closed)

  return (
    <Screen>
      <ScreenHeader
        title="구인글 & 역경매"
        right={
          tab === 'bids' ? (
            <Button size="sm" variant="brand" leading={<Plus size={14} />} onClick={() => setBidSheetOpen(true)}>
              등록
            </Button>
          ) : undefined
        }
      />
      <ScreenBody>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'posts', label: '구인글' },
            { value: 'bids', label: '역경매' },
          ]}
        />

        <div className="mt-4">
          {tab === 'posts' ? (
            openPosts.length === 0 ? (
              <EmptyState art="stage" title="열려있는 구인글이 없어요" description="곧 새 구인글이 올라올 거예요." />
            ) : (
              <div className="space-y-2.5">
                {openPosts.map((post) => {
                  const venue = venues.find((v) => v.id === post.venueId)
                  if (!venue) return null
                  const applied = post.applications.some((a) => a.performerId === performerId)
                  return (
                    <div key={post.id} className="card p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{venue.name}</p>
                        {applied && <Tag tone="ok">지원함</Tag>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {post.wantedGenres.map((g) => (
                          <GenreTag key={g} genre={g} size="sm" />
                        ))}
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-2">
                        {post.message}
                      </p>
                      <div className="tnum mt-2 flex items-center justify-between text-2xs text-ink-3">
                        <span>{post.offerFee === 0 ? '수익 배분' : priceLabel(post.offerFee)}</span>
                        <span>{humanDate(post.createdAt, nowIso)} 등록</span>
                      </div>
                      <Button
                        full
                        size="sm"
                        variant={applied ? 'outline' : 'brand'}
                        className="mt-3"
                        disabled={applied}
                        onClick={() => setApplyTarget(post)}
                      >
                        {applied ? '지원 완료' : '지원하기'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )
          ) : bids.length === 0 ? (
            <EmptyState
              art="search"
              title="등록한 역경매가 없어요"
              description="원하는 조건을 올리면 공간이 먼저 제안합니다."
              action={
                <Button variant="brand" onClick={() => setBidSheetOpen(true)}>
                  역경매 등록하기
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="card p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{bid.wantedRegion}</p>
                    <span className="tnum text-2xs text-ink-3">
                      최소 {won(bid.minFee)}원
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{bid.message}</p>
                  {bid.proposals.length === 0 ? (
                    <p className="mt-3 text-2xs text-ink-3">아직 제안이 없어요. 곧 도착할 거예요.</p>
                  ) : (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      <p className="text-2xs font-bold text-ink-2">도착한 제안 {bid.proposals.length}건</p>
                      {bid.proposals.map((prop, i) => {
                        const venue = venues.find((v) => v.id === prop.venueId)
                        return (
                          <div key={i} className="rounded-lg bg-surface-2 p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{venue?.name ?? '공간'}</span>
                              <span className="tnum text-xs font-bold text-gold-text">
                                {won(prop.fee)}원
                              </span>
                            </div>
                            <p className="mt-1 text-2xs leading-relaxed text-ink-2">{prop.message}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>

      <ApplyToPostSheet
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        post={applyTarget}
        venueName={venues.find((v) => v.id === applyTarget?.venueId)?.name ?? '공간'}
      />
      <CreateBidSheet open={bidSheetOpen} onClose={() => setBidSheetOpen(false)} />
    </Screen>
  )
}
