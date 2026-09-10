import { CalendarClock, MapPinned, Users2, X } from 'lucide-react'
import { useAppNavigate } from '@/lib/appLink'
import { LogoMark } from '@/components/shell/LogoMark'
import { FEE_DISCLAIMER, SERVICE_NAME, SERVICE_TAGLINE } from '@/config/brand'
import { OPERATOR } from '@/config/legal'
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
 * 커튼 개막(1막)은 유지합니다 — 첫인상이 이 서비스의 성격을 한 번에 말해줍니다.
 * 2막 가로 트랙은 스크롤이 너무 길어 쓰지 않습니다.
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
  const go = useAppNavigate()
  return (
    <div className="min-h-screen w-full bg-bg text-ink">
      {/* ★ 이 브라우저에서 처음 접속했을 때만 뜨는 화면이라, 굳이 다 안 봐도 바로
          앱으로 넘어갈 수 있어야 합니다. go() 가 markLandingSeen 을 함께 하므로
          다음 접속부터는 이 화면 자체가 안 뜹니다. */}
      <button
        onClick={() => go('/')}
        aria-label="다시 보지 않기"
        className="pointer-events-auto fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"
        style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <X size={13} />
        다시 보지 않기
      </button>

      {/* ★ 스크롤로 커튼이 열리는 1막을 씁니다. 2막 가로 트랙까지 605dvh 를 스크롤하게
          만들면 대부분 그전에 떠나서, 개막 연출만 남겼습니다. */}
      <CurtainHero mode="act1" />

      {/* 차별점 — 한 문장 */}
      <section className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
        <ScrollReveal>
          <p className="text-gold-text text-xs font-bold uppercase tracking-widest">
            {SERVICE_NAME}가 다른 점
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight md:text-3xl">
            무대는 정식 공연장에만 있지 않습니다.
            <br />
            전국 곳곳에 무대를 만듭니다.
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
      <section className="border-y border-border bg-surface-2/60 py-14 md:py-20">
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
      <section className="border-t border-border px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <LogoMark className="mx-auto w-[150px]" />
          <p className="mt-5 text-[15px] font-semibold">
            당신의 가게가 이 동네 첫 무대가 될 수 있습니다.
          </p>
          <LandingCtaRow className="mt-7" />
        </div>
      </section>

      {/* ★ 약관 링크가 어디에도 없었습니다. 랜딩이 이 서비스의 첫 화면이라
          법적 문서는 여기서 닿을 수 있어야 합니다 (§16). */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold text-ink-2">
            {SERVICE_NAME} · {SERVICE_TAGLINE}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">{FEE_DISCLAIMER}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              onClick={() => go('/legal/terms')}
              className="text-xs font-semibold text-ink-2 underline underline-offset-2"
            >
              이용약관
            </button>
            <button
              onClick={() => go('/legal/privacy')}
              className="text-xs font-semibold text-ink-2 underline underline-offset-2"
            >
              개인정보처리방침
            </button>
            {OPERATOR.email && (
              <a
                href={`mailto:${OPERATOR.email}`}
                className="text-xs font-semibold text-ink-2 underline underline-offset-2"
              >
                문의
              </a>
            )}
          </div>
          {OPERATOR.name && (
            <p className="mt-3 text-xs text-ink-3">운영: {OPERATOR.name}</p>
          )}
        </div>
      </footer>
    </div>
  )
}
