import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** 화면 전환 — 좌우 슬라이드 + 페이드 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, x: 22 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
