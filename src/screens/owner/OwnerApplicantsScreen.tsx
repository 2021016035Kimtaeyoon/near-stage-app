import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { GenreTag, Tag } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { priceLabel } from '@/lib/datetime'
import { useAppStore, useNow } from '@/store/useAppStore'
import type { Application } from '@/types'
import { AcceptSheet } from './AcceptSheet'
import { ApplicantCard } from './ApplicantCard'
import { RejectSheet } from './RejectSheet'

export function OwnerApplicantsScreen() {
  const { postId } = useParams<{ postId: string }>()
  const posts = useAppStore((s) => s.posts)
  const performers = useAppStore((s) => s.performers)
  const venues = useAppStore((s) => s.venues)
  const nowIso = useNow()

  const [target, setTarget] = useState<Application | null>(null)
  const [mode, setMode] = useState<'accept' | 'reject' | null>(null)

  const post = posts.find((p) => p.id === postId)
  const venue = post ? venues.find((v) => v.id === post.venueId) : undefined
  const targetPerformer = target ? performers.find((p) => p.id === target.performerId) : undefined

  if (!post || !venue) {
    return (
      <Screen>
        <ScreenHeader title="지원자" back />
        <EmptyState art="search" title="구인글을 찾을 수 없어요" />
      </Screen>
    )
  }

  const sorted = post.applications
    .slice()
    .sort((a, b) => (a.status === '대기' ? -1 : 1) - (b.status === '대기' ? -1 : 1))

  return (
    <Screen>
      <ScreenHeader title="지원자" subtitle={venue.name} back />
      <ScreenBody>
        <div className="card mb-4 p-3.5">
          <div className="flex items-center gap-1.5">
            {post.wantedGenres.map((g) => (
              <GenreTag key={g} genre={g} size="sm" />
            ))}
            {post.closed && <Tag tone="ok">마감</Tag>}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{post.message}</p>
          <p className="tnum mt-1.5 text-2xs text-ink-3">
            제시 조건: {post.offerFee === 0 ? '수익 배분' : priceLabel(post.offerFee)}
          </p>
        </div>

        {sorted.length === 0 ? (
          <EmptyState art="search" title="아직 지원자가 없어요" description="조건에 맞는 아티스트에게 곧 알림이 도착합니다." />
        ) : (
          <div className="space-y-3">
            {sorted.map((application) => {
              const performer = performers.find((p) => p.id === application.performerId)
              if (!performer) return null
              return (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  performer={performer}
                  venue={venue}
                  nowIso={nowIso}
                  post={post}
                  onAccept={() => {
                    setTarget(application)
                    setMode('accept')
                  }}
                  onReject={() => {
                    setTarget(application)
                    setMode('reject')
                  }}
                />
              )
            })}
          </div>
        )}

        <TabBarSpacer />
      </ScreenBody>

      {target && mode === 'accept' && targetPerformer && (
        <AcceptSheet
          open
          onClose={() => setMode(null)}
          post={post}
          application={target}
          performer={targetPerformer}
        />
      )}
      {target && mode === 'reject' && (
        <RejectSheet open onClose={() => setMode(null)} post={post} application={target} />
      )}
    </Screen>
  )
}
