import { CalendarClock, MapPinned, Users2, X } from 'lucide-react'
import { useAppNavigate } from '@/lib/appLink'
import { LogoMark } from '@/components/shell/LogoMark'
import { FEE_DISCLAIMER, SERVICE_NAME, SERVICE_TAGLINE } from '@/config/brand'
import { OPERATOR } from '@/config/legal'
import { CurtainHero } from './hero/CurtainHero'
import { LandingCtaRow } from './LandingCtaRow'
import { LandingFaq } from './LandingFaq'
import { UpcomingShowsPreview } from './UpcomingShowsPreview'

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
    // ★ data-theme="dark" 를 여기 통째로 겁니다. 커튼 히어로(크림슨·금색)가 만든
    //   "무대의 어둠" 무드를 스크롤 이후 섹션들이 흰 배경으로 깨고 있었습니다 —
    //   사용자의 라이트/다크 설정과 무관하게, 랜딩은 항상 극장 다크로 통일합니다
    //   (index.css의 [data-theme='dark'] 주석이 이미 이 용도를 예정해뒀습니다).
    //   아래 섹션들은 전부 토큰 클래스만 쓰고 있어서 하드코딩된 흰색이 없고,
    //   이 한 줄만으로 전체가 자동으로 다크 팔레트를 입습니다.
    <div data-theme="dark" className="relative min-h-screen w-full bg-[#07070A] text-ink">
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

      {/* ★ 랜딩 전체가 **고정 구간 하나**입니다. 첫 화면에서 고정되어, 커튼이 열리고
          로고가 선 뒤 그 자리에서 설명 판들이 좌측으로 넘어갑니다. 로고는 따로 그리지
          않고 회전무대의 첫 판으로 히어로가 직접 들고 있습니다(로고 중복 불가).
          마지막 판은 돌아 나가지 않고 그대로 남아 페이지가 끝납니다 — 그래서 끝에서
          아래로 밀려 내려가는 구간이 없습니다. */}
      <CurtainHero
        mode="act1"
        panels={[

            <section key="diff" className="mx-auto max-w-3xl text-center">
              <p className="text-gold-text text-xs font-bold uppercase tracking-widest">
                {SERVICE_NAME}가 다른 점
              </p>
              <h2
                className="mt-3 text-2xl font-extrabold leading-snug tracking-tight md:text-3xl"
                style={{ textShadow: '0 2px 24px rgba(0,0,0,.65)' }}
              >
                무대는 정식 공연장에만 있지 않습니다.
                <br />
                전국 곳곳에 무대를 만듭니다.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
                공연할 곳이 없는 팀과 손님이 필요한 가게를 직접 연결해 무대를 만들고, 그렇게
                생긴 공연을 지도에 올립니다.
              </p>
              <LandingCtaRow className="mt-9" />
            </section>,

            <UpcomingShowsPreview key="upcoming" />,

            <section key="roles" className="mx-auto max-w-5xl">
              <h2
                className="text-center text-2xl font-extrabold tracking-tight md:text-3xl"
                style={{ textShadow: '0 2px 24px rgba(0,0,0,.65)' }}
              >
                세 사람이 만나 하나의 무대가 됩니다
              </h2>
              {/* ★ 고정된 한 화면 안에 들어가야 해서, 모바일에서는 카드를 가로형으로
                  눕혀 세 장이 겹치지 않고 다 보이게 합니다. */}
              <div className="mt-8 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-5">
                {ROLES.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm md:block md:p-7"
                  >
                    <span className="bg-gold-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gold-ink md:h-11 md:w-11">
                      <r.icon size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-extrabold md:mt-4 md:text-lg">{r.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-2 md:mt-2 md:text-sm">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <LandingCtaRow className="mt-8 md:mt-10" />
            </section>,

            <LandingFaq key="faq" />,

            /* ★ 마지막 판 — 돌아 나가지 않고 정면에 그대로 남습니다. 약관·문의도
               여기 함께 둬서, 이 판 뒤로 더 스크롤할 것이 없게 만듭니다. 별도 푸터를
               아래에 두면 마지막에 화면이 위로 밀려 올라가 버립니다(보고된 증상). */
            <section key="closing" className="mx-auto max-w-3xl text-center">
              <LogoMark className="mx-auto w-[150px] md:w-[190px]" />
              <p
                className="mt-5 text-[15px] font-semibold"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,.6)' }}
              >
                당신의 가게가 이 동네 첫 무대가 될 수 있습니다.
              </p>
              <LandingCtaRow className="mt-7" />

              <div className="mt-10 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold text-ink-2">
                  {SERVICE_NAME} · {SERVICE_TAGLINE}
                </p>
                <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-ink-3">
                  {FEE_DISCLAIMER}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
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
            </section>,
          ]}
        />
    </div>
  )
}
