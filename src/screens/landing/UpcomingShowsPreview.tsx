import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PosterArt } from '@/components/ui/PosterArt'
import { humanDateTime, priceLabel } from '@/lib/datetime'
import { resolvePlace } from '@/store/selectors'
import { useAppStore, useNow } from '@/store/useAppStore'
import { ScrollReveal } from './ScrollReveal'

/**
 * 임박한 공연 4건.
 *
 * ★ 목데이터가 아니라 실제 DB에서 옵니다. 공연이 한 건도 없으면 섹션 자체를 숨깁니다 —
 * 오픈 직후에는 그게 정상 상태이고, 빈 카드 네 개를 보여주는 것보다 없는 편이 낫습니다.
 *
 * 지금은 스토어가 비어 있어 아무것도 렌더되지 않습니다. 5단계에서 데이터 훅을 붙이면
 * 이 컴포넌트는 그대로 두고 읽는 곳만 바뀝니다.
 */
export function UpcomingShowsPreview() {
  const navigate = useNavigate()
  const shows = useAppStore((s) => s.shows)
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const nowIso = useNow()

  const now = new Date(nowIso).getTime()
  const upcoming = shows
    .filter((s) => new Date(s.startAt).getTime() + s.durationMin * 60_000 >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 4)

  if (upcoming.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <ScrollReveal className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">곧 열리는 무대</h2>
        <p className="mt-3 text-sm text-ink-2">지금 지도에 올라와 있는 공연입니다.</p>
      </ScrollReveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {upcoming.map((show) => {
          const place = resolvePlace(show, venues)
          const performer = performers.find((p) => p.id === show.performerId)
          return (
            <button
              key={show.id}
              onClick={() => navigate(`/desktop/audience/show/${show.id}`)}
              className="card overflow-hidden text-left"
            >
              <PosterArt
                seed={show.id + (performer?.photoSeed ?? show.title)}
                genre={show.genre}
                className="aspect-[4/3] w-full"
              />
              <div className="p-3.5">
                <p className="truncate text-[13px] font-bold">{show.title}</p>
                <p className="mt-1 flex items-center gap-1 truncate text-2xs text-ink-2">
                  <MapPin size={10} className="shrink-0" />
                  {place?.name ?? '장소 미정'}
                </p>
                <p className="tnum mt-1.5 text-2xs font-semibold text-ink-3">
                  {humanDateTime(show.startAt, nowIso)} · {priceLabel(show.ticketPrice)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
