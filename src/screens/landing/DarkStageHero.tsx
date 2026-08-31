import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { SERVICE_DESCRIPTION } from '@/config/brand'

/**
 * 랜딩 첫 화면 — 텅 빈 어두운 무대에서 시작해, 스크롤에 따라
 * 조명이 켜지고 로고가 위에서 내려와 자리 잡은 뒤 설명이 뜨는
 * 한 장면짜리 인트로. 이 섹션 안에서만 쓰는 어두운 연출이며,
 * 실제 서비스 로고 색은 다른 화면과 동일한 브랜드 블루를 그대로 씁니다.
 */
export function DarkStageHero() {
  const navigate = useNavigate()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const spotlightOpacity = useTransform(scrollYProgress, [0, 0.32], [0, 1])
  const spotlightScale = useTransform(scrollYProgress, [0, 0.4], [0.35, 1])
  const floorOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1])
  const logoY = useTransform(scrollYProgress, [0.16, 0.46], [-140, 0])
  const logoOpacity = useTransform(scrollYProgress, [0.16, 0.4], [0, 1])
  const textOpacity = useTransform(scrollYProgress, [0.48, 0.72], [0, 1])
  const textY = useTransform(scrollYProgress, [0.48, 0.72], [18, 0])

  return (
    <section ref={ref} className="relative h-[230dvh] bg-[#0F0F14]">
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center overflow-hidden px-6">
        {/* 위에서 내려오는 조명 — 좁고 밝은 코어 + 넓은 헤일로 두 겹 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          style={{ opacity: spotlightOpacity, scale: spotlightScale }}
        >
          <div
            className="h-[900px] w-[1100px]"
            style={{
              background:
                'radial-gradient(ellipse 30% 60% at 50% 0%, rgba(255,250,240,.55) 0%, rgba(255,244,222,.22) 30%, rgba(255,244,222,.08) 50%, transparent 72%)',
            }}
          />
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          style={{ opacity: spotlightOpacity }}
        >
          <div
            className="h-[420px] w-[260px]"
            style={{
              background:
                'radial-gradient(ellipse 60% 90% at 50% 0%, rgba(255,255,255,.65) 0%, rgba(255,250,240,.2) 55%, transparent 80%)',
            }}
          />
        </motion.div>

        {/* 조명이 닿는 무대 바닥 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[320px]"
          style={{
            opacity: floorOpacity,
            background:
              'radial-gradient(ellipse 55% 100% at 50% 100%, rgba(255,244,222,.16) 0%, transparent 70%)',
          }}
        />

        <motion.div style={{ y: logoY, opacity: logoOpacity }} className="relative z-10">
          <LogoMark dark stageColor="#FF5560" className="w-[260px] sm:w-[340px]" />
        </motion.div>

        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="relative z-10 mt-8 max-w-lg text-center"
        >
          <p className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
            공연자 × 공간주 × 관객, 3면 마켓플레이스
          </p>
          <h1 className="mt-5 text-3xl font-extrabold leading-[1.25] tracking-tight text-white md:text-4xl">
            공연할 곳이 없나요?
            <br />
            <span className="brand-text">손님 없는 시간</span>이 아깝나요?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
            {SERVICE_DESCRIPTION}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/desktop')}
              className="brand-gradient rounded-full px-7 py-4 text-[15px] font-bold text-white"
              style={{ boxShadow: '0 16px 40px rgba(61,95,199,.4)' }}
            >
              웹으로 둘러보기 →
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-white/25 px-7 py-4 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
            >
              모바일 앱 체험하기
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
