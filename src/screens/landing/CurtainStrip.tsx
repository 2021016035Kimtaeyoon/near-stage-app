import { motion, useTransform, type MotionValue } from 'framer-motion'
import { CURTAIN_OPEN_START, CURTAIN_STAGGER_MAX, CURTAIN_STRIP_DURATION } from './heroTimeline'

const CURTAIN_COLORS = ['#5E0A14', '#A8172B', '#C4213A', '#7A0F1E']

interface Props {
  progress: MotionValue<number>
  index: number
  total: number
}

/**
 * 커튼 세로 조각 하나. 가장자리가 먼저, 중앙이 마지막에 움직이도록
 * 조각마다 다른 시작 지점에서 자신만의 useTransform을 갖습니다.
 * 위에서 접혀 모이는 효과를 위해 translateY + scaleY(top 기준)를 함께 씁니다.
 */
export function CurtainStrip({ progress, index, total }: Props) {
  const center = (total - 1) / 2
  const closeness = center === 0 ? 0 : 1 - Math.abs(index - center) / center
  const start = CURTAIN_OPEN_START + closeness * CURTAIN_STAGGER_MAX
  const end = start + CURTAIN_STRIP_DURATION

  const y = useTransform(progress, [start, end], ['0%', '-104%'])
  const scaleY = useTransform(progress, [start, end], [1, 0.82])

  const foldWidth = 5 + ((index * 7) % 11)
  const colorA = CURTAIN_COLORS[index % CURTAIN_COLORS.length]
  const colorB = CURTAIN_COLORS[(index + 2) % CURTAIN_COLORS.length]
  const grow = 0.82 + ((index * 5) % 7) * 0.06

  return (
    <motion.div
      aria-hidden
      className="h-full"
      style={{
        flexGrow: grow,
        flexShrink: 0,
        flexBasis: 0,
        y,
        scaleY,
        transformOrigin: 'top',
        willChange: 'transform',
        backgroundImage: `repeating-linear-gradient(90deg, ${colorA} 0px, ${colorB} ${foldWidth}px, ${colorA} ${foldWidth * 2}px)`,
        boxShadow: 'inset -6px 0 10px rgba(0,0,0,.35), inset 6px 0 10px rgba(0,0,0,.25)',
      }}
    />
  )
}
