import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** 등장 방향 — 아래에서 위로(기본), 좌/우에서 슬라이드 */
  direction?: 'up' | 'left' | 'right'
  delay?: number
  className?: string
}

const OFFSETS = {
  up: { y: 36, x: 0 },
  left: { y: 0, x: -36 },
  right: { y: 0, x: 36 },
}

/**
 * 스크롤로 뷰포트에 들어올 때 한 번 나타나는 공용 리빌 래퍼.
 * `viewport={{ once: true }}`라 재방문 시 다시 스크롤해도 깜빡이지 않습니다.
 */
export function ScrollReveal({ children, direction = 'up', delay = 0, className }: Props) {
  const offset = OFFSETS[direction]
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offset.y, x: offset.x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** 자식들을 순서대로 하나씩 띄우는 스태거 컨테이너 */
export function StaggerGroup({
  children,
  className,
  stagger = 0.09,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}
