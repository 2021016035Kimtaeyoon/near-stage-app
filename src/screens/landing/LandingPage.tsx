import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { cn } from '@/lib/cn'
import { DarkStageHero } from './DarkStageHero'
import {
  ClosingSection,
  DifferentiationSection,
  FeaturesSection,
  RolesSection,
  StatsBand,
} from './LandingSections'
import { PhoneMockup } from './PhoneMockup'

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
  const [overHero, setOverHero] = useState(true)

  const heroWrapRef = useRef<HTMLDivElement>(null)
  // DarkStageHero와 동일하게 'end end'를 써야 실제 pin 해제 시점과 맞습니다.
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroWrapRef,
    offset: ['start start', 'end end'],
  })
  const headerBgOpacity = useTransform(heroProgress, [0.94, 1], [0, 1])

  useMotionValueEvent(heroProgress, 'change', (v) => {
    setOverHero(v < 0.96)
  })

  return (
    <div className="min-h-screen w-full bg-bg text-ink">
      <header className="fixed inset-x-0 top-0 z-50">
        <motion.div
          aria-hidden
          className="absolute inset-0 border-b border-border bg-bg/90 backdrop-blur"
          style={{ opacity: overHero ? headerBgOpacity : 1 }}
        />
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <LogoMark dark={overHero} className="w-[104px] transition-none" />

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={cn(
                  'text-sm font-semibold transition-colors',
                  overHero ? 'text-white/80 hover:text-white' : 'text-ink-2 hover:text-ink',
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 whitespace-nowrap md:flex">
            <button
              onClick={() => navigate('/')}
              className={cn(
                'hidden rounded-full border px-4 py-2 text-sm font-bold transition-colors lg:inline-flex',
                overHero ? 'border-white/30 text-white' : 'border-border text-ink-2',
              )}
            >
              모바일 앱 체험
            </button>
            <button
              onClick={() => navigate('/desktop')}
              className="bg-gold-500 rounded-full px-4 py-2 text-sm font-bold text-gold-ink"
            >
              웹으로 시작하기
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
            className={cn('tap flex items-center justify-center md:hidden', overHero ? 'text-white' : 'text-ink')}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="relative border-t border-border bg-bg px-6 py-4 md:hidden">
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
                className="bg-gold-500 rounded-full px-4 py-2.5 text-sm font-bold text-gold-ink"
              >
                웹으로 시작하기
              </button>
            </div>
          </div>
        )}
      </header>

      <div ref={heroWrapRef}>
        <DarkStageHero />
      </div>

      <section className="mx-auto flex max-w-5xl justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <PhoneMockup />
          <p className="mt-6 text-center text-xs text-ink-3">
            회원가입 없이 바로 둘러볼 수 있는 심사용 프로토타입입니다.
          </p>
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
