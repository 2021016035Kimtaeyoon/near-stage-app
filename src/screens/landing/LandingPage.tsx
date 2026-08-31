import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { SERVICE_DESCRIPTION } from '@/config/brand'
import {
  ClosingSection,
  DifferentiationSection,
  FeaturesSection,
  RolesSection,
  StatsBand,
} from './LandingSections'
import { PhoneMockup } from './PhoneMockup'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const NAV_LINKS = [
  { href: '#differentiation', label: '차별점' },
  { href: '#roles', label: '누구를 위한 서비스인가요' },
]

/**
 * 데스크톱 마케팅 랜딩페이지. 모바일 앱 프로토타입(`/`)과는 별개의 화면이며,
 * 이 페이지의 CTA는 실제 서비스 화면인 `/desktop`으로 연결됩니다.
 */
export function LandingPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  // 배경 블롭 두 개를 서로 다른 속도로 움직여 패럴랙스 깊이감을 만듭니다
  const blobLeftY = useTransform(scrollY, [0, 800], [0, 220])
  const blobRightY = useTransform(scrollY, [0, 800], [0, -140])
  const heroFade = useTransform(scrollY, [0, 420], [1, 0.25])

  return (
    <div className="min-h-screen w-full bg-bg text-ink">
      <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <LogoMark className="w-[104px]" />

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-ink-2 hover:text-ink">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-border px-4 py-2 text-sm font-bold text-ink-2"
            >
              모바일 앱 체험
            </button>
            <button
              onClick={() => navigate('/desktop')}
              className="brand-gradient rounded-full px-4 py-2 text-sm font-bold text-white"
            >
              웹으로 시작하기
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
            className="tap flex items-center justify-center text-ink md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold text-ink-2"
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => navigate('/')}
                className="mt-1 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-ink-2"
              >
                모바일 앱 체험
              </button>
              <button
                onClick={() => navigate('/desktop')}
                className="brand-gradient rounded-full px-4 py-2.5 text-sm font-bold text-white"
              >
                웹으로 시작하기
              </button>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            style={{ y: blobLeftY }}
            className="absolute -left-40 -top-20 h-[520px] w-[520px] rounded-full opacity-[0.14] blur-[130px]"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: 'radial-gradient(circle, #6D93E8 0%, transparent 70%)' }}
            />
          </motion.div>
          <motion.div
            style={{ y: blobRightY }}
            className="absolute -right-32 top-40 h-[480px] w-[480px] rounded-full opacity-[0.12] blur-[130px]"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: 'radial-gradient(circle, #3D5FC7 0%, transparent 70%)' }}
            />
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: heroFade }}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="relative mx-auto flex max-w-6xl flex-col items-center gap-14 px-6 pb-20 pt-16 lg:flex-row lg:items-center lg:pt-24"
        >
          <div className="max-w-xl lg:flex-1">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-bold text-ink-2"
            >
              공연자 × 공간주 × 관객, 3면 마켓플레이스
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight md:text-[52px]"
            >
              공연할 곳이 없나요?
              <br />
              <span className="brand-text">손님 없는 시간</span>이 아깝나요?
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 text-[17px] leading-relaxed text-ink-2">
              {SERVICE_DESCRIPTION}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/desktop')}
                className="brand-gradient rounded-full px-7 py-4 text-[15px] font-bold text-white"
                style={{ boxShadow: '0 16px 40px rgba(61,95,199,.3)' }}
              >
                웹으로 둘러보기 →
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounded-full border border-border-strong px-7 py-4 text-[15px] font-bold text-ink"
              >
                모바일 앱 체험하기
              </button>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-4 text-xs text-ink-3">
              회원가입 없이 바로 둘러볼 수 있는 심사용 프로토타입입니다.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="flex justify-center lg:flex-1">
            <PhoneMockup />
          </motion.div>
        </motion.div>
      </section>

      <StatsBand />
      <DifferentiationSection />
      <RolesSection />
      <FeaturesSection />
      <ClosingSection />
    </div>
  )
}
