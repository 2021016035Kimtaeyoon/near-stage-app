import { motion } from 'framer-motion'
import { CalendarClock, Flame, MapPinned, Sparkles, Star, TrendingUp, Users2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SourceBadge } from '@/components/ui/Badge'
import { LogoMark } from '@/components/shell/LogoMark'
import { SERVICE_NAME, SERVICE_TAGLINE } from '@/config/brand'
import { useAppStore } from '@/store/useAppStore'
import { staggerItem } from './motionVariants'
import { ScrollReveal, StaggerGroup } from './ScrollReveal'

/** 실제 목데이터 수치를 그대로 보여주는 신뢰 지표 — 과장 없이, 지금 있는 데이터 그대로 */
export function StatsBand() {
  const venues = useAppStore((s) => s.venues)
  const performers = useAppStore((s) => s.performers)
  const shows = useAppStore((s) => s.shows)
  const ownShows = shows.filter((s) => s.source === 'own').length

  const stats = [
    { value: venues.length, label: '참여 공간' },
    { value: performers.length, label: '아티스트 팀' },
    { value: ownShows, label: '우리가 만든 공연' },
    { value: shows.length - ownShows, label: '연동된 등록 공연' },
  ]

  return (
    <div className="border-y border-border bg-surface-2/50">
      <StaggerGroup className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={staggerItem} className="text-center">
            <p className="tnum text-gold-text text-4xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-xs font-semibold text-ink-2">{s.label}</p>
          </motion.div>
        ))}
      </StaggerGroup>
    </div>
  )
}

/** 카드에 공통으로 쓰는 "떠오르는" 호버 — 그림자가 깊어지고 살짝 들립니다 */
const liftHover = {
  whileHover: { y: -8, boxShadow: '0 24px 48px -12px rgba(23,23,28,.18)' },
  transition: { type: 'spring' as const, stiffness: 300, damping: 36 },
}

export function DifferentiationSection() {
  return (
    <section id="differentiation" className="mx-auto max-w-5xl px-6 py-24">
      <ScrollReveal className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#FFC42E]">핵심 차별점</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
          정식 공연장만 보여주던 지도에,
          <br />
          동네 무대를 더했습니다
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
          기존 공연 정보 서비스는 KOPIS에 등록된 정식 공연장만 보여줍니다. NEAR:STAGE는
          등록되지 않은 동네 카페·바 무대를 직접 만들고, 등록 공연과 함께 지도에서
          유통합니다.
        </p>
      </ScrollReveal>

      <StaggerGroup className="mt-12 grid gap-5 md:grid-cols-2" stagger={0.14}>
        <motion.div variants={staggerItem} {...liftHover} className="card p-7">
          <SourceBadge source="own" />
          <h3 className="mt-4 text-xl font-extrabold">우리 무대</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            NEAR:STAGE가 직접 매칭한 카페·바·스튜디오 공연. 지도 위 브랜드 그라데이션
            마커로 한눈에 구분됩니다.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-2">
            <li>· 아티스트 프로필·클립·팔로우 확인 가능</li>
            <li>· 공간·공연 리뷰를 각각 남길 수 있음</li>
            <li>· 무료~1만 원대 부담 없는 가격</li>
          </ul>
        </motion.div>
        <motion.div variants={staggerItem} {...liftHover} className="card p-7">
          <SourceBadge source="kopis" />
          <h3 className="mt-4 text-xl font-extrabold">등록 공연</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            KOPIS(공연예술통합전산망)에 등록된 정식 공연장 공연. 외곽선 마커로
            구분되며, 뮤지컬·연극·클래식 등 큰 무대도 함께 둘러볼 수 있습니다.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-2">
            <li>· 500석 이상 대형 공연장 포함</li>
            <li>· 출연진 정보 중심으로 표시</li>
            <li>· 3만 원대 이상 정식 티켓 가격</li>
          </ul>
        </motion.div>
      </StaggerGroup>
    </section>
  )
}

const ROLES = [
  {
    icon: MapPinned,
    title: '공연보기',
    desc: '"오늘 밤 근처에 볼 거 없나?" 지도 하나로 우리 동네 무대와 정식 공연을 한 번에 찾습니다.',
  },
  {
    icon: CalendarClock,
    title: '호스트',
    desc: '한가한 시간대를 공연으로 채워 집객합니다. 장비 조건을 등록하면 매칭 실패 없이 지원자가 옵니다.',
  },
  {
    icon: Users2,
    title: '아티스트',
    desc: '설 무대가 필요한 밴드·마술·스탠드업·연극 팀. 조건에 맞는 공간을 지도에서 바로 찾고 지원합니다.',
  },
]

export function RolesSection() {
  return (
    <section id="roles" className="border-y border-border bg-surface-2/60 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            세 사람이 만나 하나의 무대가 됩니다
          </h2>
        </ScrollReveal>
        <StaggerGroup className="mt-12 grid gap-5 md:grid-cols-3">
          {ROLES.map((r) => (
            <motion.div key={r.title} variants={staggerItem} {...liftHover} className="card p-7">
              <motion.span
                whileHover={{ rotate: -8, scale: 1.08 }}
                className="bg-gold-500 flex h-11 w-11 items-center justify-center rounded-xl text-gold-ink"
              >
                <r.icon size={20} />
              </motion.span>
              <h3 className="mt-4 text-lg font-extrabold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{r.desc}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: TrendingUp,
    title: '성과 리포트',
    desc: '"공연이 있던 주 평균 방문객이 없던 주보다 몇 % 높습니다" — 숫자로 증명하는 집객 효과.',
  },
  {
    icon: Star,
    title: '장비 자동 매칭',
    desc: '아티스트가 필요한 조건과 공간의 장비를 항목별로 대조해 매칭 실패를 미리 막습니다.',
  },
  {
    icon: Flame,
    title: '실시간 인기 검색어',
    desc: '좋아요·팔로워·예약 수를 실시간으로 합산해 지금 뜨는 장르·팀·동네를 보여줍니다.',
  },
  {
    icon: Sparkles,
    title: '분리된 리뷰',
    desc: '"공간이 좋았다"와 "공연이 좋았다"는 다른 이야기입니다. 두 리뷰를 항상 따로 남깁니다.',
  },
]

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <ScrollReveal className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          숫자와 매칭이 실제로 작동합니다
        </h2>
      </ScrollReveal>
      <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={staggerItem}
            {...liftHover}
            className="flex gap-4 rounded-2xl border border-border p-6"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">
              <f.icon size={18} />
            </span>
            <div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </StaggerGroup>
    </section>
  )
}

export function ClosingSection() {
  const navigate = useNavigate()
  return (
    <section className="border-t border-border bg-[#0F0F14] py-20 text-white">
      <ScrollReveal className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          오늘 밤, 우리 동네 무대를 열어보세요
        </h2>
        <p className="mt-3 text-white/70">회원가입 없이 지금 바로 둘러볼 수 있어요.</p>
        <motion.button
          whileHover={{ y: -4, boxShadow: '0 24px 56px rgba(255,196,46,.45)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/desktop')}
          className="bg-gold-500 mt-8 rounded-full px-8 py-4 text-[15px] font-bold text-gold-ink"
          style={{ boxShadow: '0 16px 40px rgba(255,196,46,.35)' }}
        >
          웹으로 둘러보기 →
        </motion.button>
      </ScrollReveal>

      <footer className="mx-auto mt-16 max-w-5xl border-t border-white/10 px-6 pt-8">
        <LogoMark dark className="w-[104px] opacity-90" />
        <p className="mt-3 text-xs leading-relaxed text-white/50">
          {SERVICE_NAME} · {SERVICE_TAGLINE}
          <br />
          본 서비스는 심사용 프로토타입이며, 모든 데이터는 목데이터입니다.
        </p>
      </footer>
    </section>
  )
}
