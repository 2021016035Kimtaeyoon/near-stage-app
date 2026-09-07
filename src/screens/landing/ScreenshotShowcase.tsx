import { motion } from 'framer-motion'
import { staggerItem } from './motionVariants'
import { ScrollReveal, StaggerGroup } from './ScrollReveal'

/**
 * 실제 서비스 화면 3장.
 *
 * 예전에는 이 자리에 목데이터로 만든 카드 UI를 그렸지만, 가상 데이터를 코드에 남기지
 * 않기로 했습니다(§3-1). 대신 동작하는 앱을 그대로 찍은 스크린샷을 씁니다.
 * 이미지는 public/screenshots/ 에 있고, 서비스가 바뀌면 다시 찍어 교체하면 됩니다.
 */
const SHOTS: Array<{ file: string; title: string; body: string }> = [
  {
    file: 'map.jpg',
    title: '지도에서 오늘 밤 무대를 찾습니다',
    body: '동네 카페·바에서 열리는 우리 무대와 정식 공연장의 등록 공연을 한 지도에서 봅니다.',
  },
  {
    file: 'detail.jpg',
    title: '누가 무슨 공연을 하는지 먼저 봅니다',
    body: '아티스트 프로필·셋리스트·클립을 확인하고 참석 예정을 누릅니다.',
  },
  {
    file: 'dashboard.jpg',
    title: '호스트는 집객 효과를 숫자로 봅니다',
    body: '공연이 있던 날과 없던 날의 방문객을 비교해, 무대를 여는 이유를 데이터로 확인합니다.',
  },
]

export function ScreenshotShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <ScrollReveal className="text-center">
        <p className="text-gold-text text-xs font-bold uppercase tracking-widest">실제 화면</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
          기획서가 아니라 동작하는 서비스입니다
        </h2>
      </ScrollReveal>

      <StaggerGroup className="mt-12 grid gap-8 md:grid-cols-3" stagger={0.14}>
        {SHOTS.map((s) => (
          <motion.figure key={s.file} variants={staggerItem} className="flex flex-col items-center">
            <div className="w-full max-w-[280px] overflow-hidden rounded-[26px] border border-border bg-surface-2 shadow-[var(--shadow-float)]">
              <img
                src={`${import.meta.env.BASE_URL}screenshots/${s.file}`}
                alt={s.title}
                width={440}
                height={920}
                loading="lazy"
                className="block h-auto w-full"
              />
            </div>
            <figcaption className="mt-5 text-center">
              <h3 className="text-[15px] font-extrabold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.body}</p>
            </figcaption>
          </motion.figure>
        ))}
      </StaggerGroup>
    </section>
  )
}
