import { MapPin } from 'lucide-react'
import { useAppNavigate } from '@/lib/appLink'
import { ShowPoster } from '@/components/ui/ShowPoster'
import { usePublicShows } from '@/hooks/usePublicShows'
import { humanDateTime, showEndMs } from '@/lib/datetime'
import { useNow } from '@/store/useAppStore'
import { ScrollReveal } from './ScrollReveal'

/**
 * 임박한 공연 4건.
 *
 * ★ 목데이터가 아니라 실제 DB에서 옵니다. 공연이 한 건도 없으면 섹션 자체를 숨깁니다 —
 * 오픈 직후에는 그게 정상 상태이고, 빈 카드 네 개를 보여주는 것보다 없는 편이 낫습니다.
 *
 * v_public_shows 만 읽으므로 승인 안 된 공간·아티스트의 공연은 애초에 오지 않습니다.
 */
export function UpcomingShowsPreview() {
  const go = useAppNavigate()
  const { data, loading } = usePublicShows()
  const nowIso = useNow()

  const now = new Date(nowIso).getTime()
  const upcoming = data
    .filter((x) => showEndMs(x.show) >= now)
    .slice(0, 4)

  // 불러오는 중이거나 공연이 없으면 섹션 자체를 숨깁니다.
  // 랜딩에 빈 카드 네 개를 두는 것보다 없는 편이 낫습니다.
  if (loading || upcoming.length === 0) return null

  return (
    // ★ 회전무대(StageTurntable) 안에서는 한 화면에 들어가야 하므로 섹션 자체의
    //   세로 여백을 두지 않습니다. 바깥 판이 가운데 정렬과 좌우 여백을 맡습니다.
    <section className="mx-auto max-w-5xl">
      <ScrollReveal className="text-center">
        <h2
          className="text-2xl font-extrabold tracking-tight md:text-3xl"
          style={{ textShadow: '0 2px 24px rgba(0,0,0,.65)' }}
        >
          곧 열리는 무대
        </h2>
        <p className="mt-3 text-sm text-ink-2">지금 지도에 올라와 있는 공연입니다.</p>
      </ScrollReveal>

      {/* 모바일도 2열 — 1열로 쌓으면 4장이 고정 화면을 넘칩니다 */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {upcoming.map(({ show, place, performer }) => {
          return (
            <button
              key={show.id}
              onClick={() => go(`/audience/show/${show.id}`)}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] text-left backdrop-blur-sm"
            >
              <ShowPoster
                posterUrl={show.posterUrl}
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
                  {humanDateTime(show.startAt, nowIso)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
