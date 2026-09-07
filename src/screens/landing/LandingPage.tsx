import { CalendarClock, MapPinned, Users2 } from 'lucide-react'
import { LogoMark } from '@/components/shell/LogoMark'
import { SERVICE_NAME } from '@/config/brand'
import { CurtainHero } from './hero/CurtainHero'
import { LandingCtaRow } from './LandingCtaRow'
import { LandingFaq } from './LandingFaq'
import { UpcomingShowsPreview } from './UpcomingShowsPreview'
import { ScrollReveal } from './ScrollReveal'

/**
 * 실서비스 랜딩 (/#/landing).
 *
 * 유일한 목표는 방문자를 3초 안에 다음 행동으로 보내는 것입니다. 그래서
 * - 히어로는 스크롤 0에서 로고·한 줄·CTA 3개가 전부 보이는 한 장짜리이고,
 * - 전체 높이는 스크롤 3~4회 안에 끝나며,
 * - 섹션마다 같은 CTA 3개를 다시 깔아둡니다.
 *
 * 발표용 605dvh 커튼 연출은 /#/pitch 로 옮겼습니다.
 */
const ROLES = [
  {
    icon: MapPinned,
    title: '공연 보러 오신 분',
    desc: '오늘 밤 걸어갈 수 있는 거리에 어떤 무대가 있는지 지도 하나로 봅니다. 회원가입 없이 둘러볼 수 있어요.',
  },
  {
    icon: CalendarClock,
    title: '가게를 하시는 분',
    desc: '한가한 시간대를 공연으로 채웁니다. 가진 장비를 등록해두면 그 조건에 맞는 팀만 지원합니다.',
  },
  {
    icon: Users2,
    title: '공연하시는 분',
    desc: '설 무대를 찾습니다. 조건이 맞는 동네 공간에 바로 지원하고, 확정되면 지도에 공연이 올라갑니다.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-bg text-ink">
      <CurtainHero mode="compact" />

      {/* 차별점 — 한 문장 */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <ScrollReveal>
          <p className="text-gold-text text-xs font-bold uppercase tracking-widest">
            {SERVICE_NAME}가 다른 점
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight md:text-3xl">
            정식 공연장만 보여주던 지도에,
            <br />
            동네 카페·바의 무대를 더했습니다.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
            공연할 곳이 없는 팀과 손님이 필요한 가게를 직접 연결해 무대를 만들고, 그렇게
            생긴 공연을 지도에 올립니다.
          </p>
        </ScrollReveal>
        <LandingCtaRow className="mt-9" />
      </section>

      {/* 임박한 공연 — DB에 공연이 없으면 섹션 자체가 사라집니다 */}
      <UpcomingShowsPreview />

      {/* 3역할 */}
      <section className="border-y border-border bg-surface-2/60 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-extrabold tracking-tight md:text-3xl">
            세 사람이 만나 하나의 무대가 됩니다
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.title} className="card p-7">
                <span className="bg-gold-500 flex h-11 w-11 items-center justify-center rounded-xl text-gold-ink">
                  <r.icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{r.desc}</p>
              </div>
            ))}
          </div>
          <LandingCtaRow className="mt-10" />
        </div>
      </section>

      <LandingFaq />

      {/* 마무리 */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <LogoMark className="mx-auto w-[150px]" />
          <p className="mt-5 text-[15px] font-semibold">
            당신의 가게가 이 동네 첫 무대가 될 수 있습니다.
          </p>
          <LandingCtaRow className="mt-7" />
        </div>
      </section>
    </div>
  )
}
