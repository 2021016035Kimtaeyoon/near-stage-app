import { motion, useTransform, type MotionValue } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * 회전무대의 판 하나.
 *
 * ★ 이 파일은 "판 하나를 어떻게 돌릴지"만 압니다. 고정(pin)과 진행률은 히어로
 *   (FullCurtainHero)가 **하나의 sticky 구간**에서 전부 관리합니다.
 *   예전엔 히어로와 회전무대를 각각 고정 구간으로 두고 이어 붙였는데,
 *   sticky 는 섹션이 끝나기 한 화면 전에 풀려서 그 사이에 (ㄱ) 화면이 위로 밀리고
 *   (ㄴ) 로고가 두 개로 겹치고 (ㄷ) 전환점에서 버벅였습니다. 고정 구간이 하나면
 *   이 문제들이 **구조적으로** 생길 수 없습니다.
 */

/** 판 하나가 차지하는 스크롤 길이(dvh). 줄이면 전체가 짧아지고 회전이 빨라집니다 */
export const TURN_SLICE_DVH = 70

export function TurnPanel({
  p,
  index,
  total,
  isMobile,
  interactive,
  isFirst = false,
  isLast = false,
  children,
}: {
  /** 회전무대 구간의 진행률 0~1 */
  p: MotionValue<number>
  index: number
  total: number
  isMobile: boolean
  interactive: boolean
  /** 첫 판(로고) — 히어로가 이미 정면에 세워 뒀으므로 들어오는 회전이 없습니다 */
  isFirst?: boolean
  /** 마지막 판 — 돌아 나가지 않고 정면에 그대로 남습니다(페이지가 여기서 끝납니다) */
  isLast?: boolean
  children: ReactNode
}) {
  const slice = 1 / total
  const start = index * slice
  const turnedIn = start + slice * 0.34
  const holdEnd = start + slice * (isLast ? 1 : 0.74)
  const end = start + slice

  // 좁은 화면에서 큰 각도로 돌리면 원근 왜곡이 심해 글자가 뭉개집니다
  const angle = isMobile ? 58 : 84

  // 우측 뒤에서 돌아 들어와 → 정면 → 좌측 뒤로 돌아 나감
  // (원통이 왼쪽으로 구르는 방향이라, 판이 계속 좌측으로 넘어갑니다)
  const enterRotate = isFirst ? 0 : -angle
  const enterX = isFirst ? '0%' : '62%'
  const enterZ = isFirst ? 0 : -460
  const enterOpacity = isFirst ? 1 : 0

  const exitRotate = isLast ? 0 : angle
  const exitX = isLast ? '0%' : '-62%'
  const exitZ = isLast ? 0 : -460
  const exitOpacity = isLast ? 1 : 0

  const rotateY = useTransform(p, [start, turnedIn, holdEnd, end], [enterRotate, 0, 0, exitRotate])
  const x = useTransform(p, [start, turnedIn, holdEnd, end], [enterX, '0%', '0%', exitX])
  const z = useTransform(p, [start, turnedIn, holdEnd, end], [enterZ, 0, 0, exitZ])
  const opacity = useTransform(
    p,
    [start, start + slice * 0.14, holdEnd, end - slice * 0.06],
    [enterOpacity, 1, 1, exitOpacity],
  )

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{
        rotateY,
        x,
        z,
        opacity,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
        // 정면에 선 판만 클릭을 받습니다 — 뒤로 돌아간 판의 CTA 가 화면 앞을 막으면
        // "버튼이 안 눌린다"가 됩니다.
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      {/* 고정된 한 화면 안에 들어가야 하므로, 넘치면 판 안에서만 스크롤되게 둡니다 */}
      <div className="no-scrollbar max-h-[calc(100dvh-72px)] w-full overflow-y-auto">
        {children}
      </div>
    </motion.div>
  )
}
