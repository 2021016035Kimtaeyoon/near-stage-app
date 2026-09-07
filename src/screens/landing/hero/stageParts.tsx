import { motion } from 'framer-motion'

/**
 * 무대 구성 요소 — 배경벽·바닥·조명·커튼 한 폭.
 *
 * 발표용 히어로(/#/pitch)와 실서비스 히어로(/#/landing)가 같은 무대를 씁니다.
 * 로고·색·질감이 두 페이지에서 완전히 같아야 하므로 여기 한 곳에만 둡니다.
 */

/** 실제 벨벳 커튼 사진 — public/ 에서 그대로 서빙합니다 */
export const CURTAIN_IMAGE = `${import.meta.env.BASE_URL}curtain-velvet.jpg`

export function StageBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0A0A0D 0%, #121216 55%, #050506 100%),' +
            'repeating-linear-gradient(90deg, rgba(255,255,255,.018) 0px, rgba(255,255,255,.018) 1px, transparent 1px, transparent 26px)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[46%]" style={{ perspective: '640px', perspectiveOrigin: '50% 0%' }}>
        <div
          className="h-full w-full"
          style={{
            transform: 'rotateX(64deg)',
            transformOrigin: 'top',
            background:
              'repeating-linear-gradient(90deg, #17110D 0px, #1D1611 9px, #17110D 18px),' +
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.92) 92%)',
          }}
        />
      </div>
      <div
        className="absolute inset-y-0 left-0 w-[9%]"
        style={{ background: 'linear-gradient(90deg, #4A0B12 0%, #6B0F1B 100%)', boxShadow: 'inset -18px 0 30px rgba(0,0,0,.6)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[9%]"
        style={{ background: 'linear-gradient(270deg, #4A0B12 0%, #6B0F1B 100%)', boxShadow: 'inset 18px 0 30px rgba(0,0,0,.6)' }}
      />
      <svg className="absolute inset-x-0 top-0 h-[8%] w-full opacity-70" viewBox="0 0 400 40" preserveAspectRatio="none">
        <rect x="0" y="14" width="400" height="4" fill="#2B2B33" />
        {[40, 120, 200, 280, 360].map((x) => (
          <g key={x}>
            <rect x={x - 3} y="6" width="6" height="12" fill="#3A3A44" />
            <circle cx={x} cy="20" r="7" fill="#1C1C22" stroke="#3A3A44" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    </div>
  )
}

export function SpotLight({
  xPercent,
  opacity,
  size,
}: {
  xPercent: number
  opacity: import('framer-motion').MotionValue<number>
  size: number
}) {
  return (
    <motion.div aria-hidden className="pointer-events-none absolute top-0" style={{ left: `${xPercent}%`, opacity, willChange: 'opacity' }}>
      <div
        className="absolute top-0 -translate-x-1/2"
        style={{
          width: 280 * size,
          height: 620 * size,
          clipPath: 'polygon(43% 0%, 57% 0%, 100% 100%, 0% 100%)',
          background: 'linear-gradient(180deg, rgba(255,247,225,.5) 0%, rgba(255,247,225,.08) 70%, transparent 100%)',
          filter: 'blur(18px)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute rounded-[100%] -translate-x-1/2"
        style={{
          top: 560 * size,
          width: 260 * size,
          height: 90 * size,
          background: 'radial-gradient(ellipse, rgba(255,247,225,.85) 0%, transparent 72%)',
          filter: 'blur(10px)',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  )
}



/**
 * 커튼 패널 한 폭의 표면. 주름은 SVG path(+ridge/valley 그라데이션)로,
 * 그 위에 4겹 오버레이(세로 falloff·측면 조명·안쪽 선단 하이라이트·비네트)를 얹는다.
 * 이 컴포넌트 전체가 부모 motion.div의 scaleX/x와 함께 통째로 움직인다.
 */
/**
 * 커튼 한 폭. 실제 벨벳 커튼 사진(public/curtain-velvet.jpg)을 그대로 씁니다.
 *
 * 좌우 두 폭이 합쳐져 사진 한 장이 되도록, 각 폭은 사진의 왼쪽/오른쪽 절반만 보여줍니다
 * (background-size: 200% → 폭 하나가 사진의 절반). 커튼이 열릴 때 부모의 scaleX가
 * 줄어들면 배경도 같이 눌리는데, 이게 실제로 천이 주름지며 모이는 것처럼 보입니다.
 */
export function CurtainPanelSurface({
  side,
  showVignette,
}: {
  side: 'left' | 'right'
  showVignette: boolean
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${CURTAIN_IMAGE})`,
          backgroundSize: '200% 100%',
          // 왼쪽 폭은 사진 왼쪽 절반, 오른쪽 폭은 오른쪽 절반
          backgroundPosition: side === 'left' ? 'left center' : 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 무대 조명 — 안쪽(중앙 이음새 쪽)에서 천을 비춥니다 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            side === 'left'
              ? 'radial-gradient(115% 80% at 100% 34%, rgba(255,164,130,.20) 0%, rgba(255,120,90,.05) 40%, transparent 74%)'
              : 'radial-gradient(115% 80% at 0% 34%, rgba(255,164,130,.20) 0%, rgba(255,120,90,.05) 40%, transparent 74%)',
        }}
      />
      {/* 안쪽 선단 — 빛이 천 앞단을 스치는 얇은 띠 */}
      <div
        className="pointer-events-none absolute top-0 h-full w-[3px]"
        style={
          side === 'left'
            ? { right: 0, background: 'linear-gradient(180deg, transparent 4%, rgba(255,214,178,.4) 38%, rgba(255,214,178,.1) 64%, transparent 78%)' }
            : { left: 0, background: 'linear-gradient(180deg, transparent 4%, rgba(255,214,178,.4) 38%, rgba(255,214,178,.1) 64%, transparent 78%)' }
        }
      />
      {/* 바깥쪽 끝 — 무대 밖으로 사라지듯 어둡게 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            side === 'left'
              ? 'linear-gradient(90deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.16) 28%, transparent 60%)'
              : 'linear-gradient(270deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.16) 28%, transparent 60%)',
        }}
      />
      {/* 위: 배튼 그늘 / 아래: 바닥 그늘 — 밸런스·무대 바닥과 이어지게 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,.2) 8%, transparent 38%, transparent 80%, rgba(0,0,0,.4) 96%, rgba(0,0,0,.6) 100%)',
        }}
      />
      {showVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 95% at 50% 45%, transparent 52%, rgba(0,0,0,.28) 100%)' }}
        />
      )}
    </div>
  )
}
