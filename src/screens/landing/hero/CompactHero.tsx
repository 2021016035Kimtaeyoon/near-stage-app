import { motion, useMotionValue } from 'framer-motion'
import { ArrowRight, Music4, Store } from 'lucide-react'
import { useAppNavigate } from '@/lib/appLink'
import { LogoMark } from '@/components/shell/LogoMark'
import { FREE_TRIAL_NOTICE } from '@/config/brand'
import { HERO_TAGLINE } from '../heroTimeline'
import { CurtainPanelSurface, SpotLight, StageBackdrop } from './stageParts'

/**
 * 실서비스 랜딩의 히어로.
 *
 * 발표용(/#/pitch)의 605dvh 스크롤 연출과 달리, 여기는 **첫 화면 한 장**이 전부입니다.
 * 스크롤 0에서 로고·한 줄·CTA 3개가 모두 보여야 하므로 pin도 타임라인도 쓰지 않습니다.
 * 대신 같은 무대(배경벽·바닥·조명·벨벳 커튼 사진)를 그대로 써서, 두 페이지가
 * 같은 브랜드로 보이게 합니다. 커튼은 이미 열려 양옆에 걸려 있는 상태입니다.
 */
export function CompactHero() {
  const go = useAppNavigate()
  // 무대 조명은 고정 밝기 — 스크롤 연출이 없으므로 MotionValue를 상수로 넣습니다
  const full = useMotionValue(1)

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0A0A0D]">
      <StageBackdrop />
      <SpotLight xPercent={27} opacity={full} size={1} />
      <SpotLight xPercent={73} opacity={full} size={1} />
      <SpotLight xPercent={50} opacity={full} size={1.3} />

      {/* 열린 커튼 — 양옆에 걸려 무대를 감쌉니다 */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[18%] origin-left md:w-[15%]">
        <CurtainPanelSurface side="left" showVignette={false} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[18%] origin-right md:w-[15%]">
        <CurtainPanelSurface side="right" showVignette={false} />
      </div>

      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <LogoMark dark className="w-[210px] sm:w-[280px]" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-md text-[15px] font-semibold leading-relaxed text-white/85 sm:text-[17px]"
        >
          {HERO_TAGLINE}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex w-full max-w-md flex-col items-stretch gap-2.5 sm:mt-9"
        >
          <button
            onClick={() => go('/')}
            className="bg-gold-500 flex h-[54px] items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-gold-ink"
          >
            공연 보러가기
            <ArrowRight size={17} />
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={() => go('/host/venue/new')}
              className="flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/25 text-[14px] font-bold text-white"
            >
              <Store size={16} />
              우리 가게 등록하기
            </button>
            <button
              onClick={() => go('/artist/new')}
              className="flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/25 text-[14px] font-bold text-white"
            >
              <Music4 size={16} />
              공연팀 등록하기
            </button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.34 }}
          className="mt-5 text-2xs font-semibold text-white/55"
        >
          {FREE_TRIAL_NOTICE} · 회원가입 없이 둘러볼 수 있어요
        </motion.p>
      </div>
    </section>
  )
}
