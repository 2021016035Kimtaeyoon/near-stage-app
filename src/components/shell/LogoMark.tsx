import { ARC_LOWER, ARC_UPPER, LOGO_VIEWBOX, NEAR, STAGE_FONT_SIZE, STAGE_LETTERS } from './logoGeometry'

type Variant = 'plain' | 'stage' | 'marquee'

interface Props {
  className?: string
  /** 어두운 배경 위에 놓일 때 — 곡선과 NEAR만 흰색으로 반전 (STAGE 금색은 고정) */
  dark?: boolean
  variant?: Variant
}

const FONT_FAMILY = 'Pretendard Variable, Pretendard, -apple-system, sans-serif'
const GOLD = '#FFC42E'
const OUTLINE = '#1A1005'
const SHADOW = '#C0271F'

/** [윗선, 아랫선] 두께 */
const LINE_WIDTHS: Record<Variant, [number, number]> = {
  plain: [3.2, 3.2],
  stage: [2.2, 5.4],
  marquee: [0, 5.4],
}

/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 * 좌표는 전부 logoGeometry.ts에서 생성한 값을 그대로 씁니다.
 */
export function LogoMark({ className, dark = false, variant = 'plain' }: Props) {
  const lineColor = dark ? '#FFFFFF' : '#0A0A0F'
  const [upperWidth, lowerWidth] = LINE_WIDTHS[variant]
  const hasOutline = variant !== 'marquee'
  const hasShadow = variant === 'marquee'

  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label="NEAR:STAGE">
      {upperWidth > 0 && <path d={ARC_UPPER} fill="none" stroke={lineColor} strokeWidth={upperWidth} />}
      <path d={ARC_LOWER} fill="none" stroke={lineColor} strokeWidth={lowerWidth} />

      <text
        x={NEAR.x}
        y={NEAR.y}
        textAnchor="middle"
        fontFamily={FONT_FAMILY}
        fontWeight={900}
        fontSize={NEAR.fontSize}
        fill={lineColor}
        letterSpacing={NEAR.letterSpacing}
      >
        NEAR
      </text>

      {hasShadow && (
        <g transform="translate(1,1.5)">
          {STAGE_LETTERS.map((l) => (
            <text
              key={`shadow-${l.ch}`}
              x={l.x}
              y={l.y}
              transform={`rotate(${l.rot} ${l.x} ${l.y})`}
              textAnchor="middle"
              fontFamily={FONT_FAMILY}
              fontWeight={800}
              fontSize={STAGE_FONT_SIZE}
              fill={SHADOW}
            >
              {l.ch}
            </text>
          ))}
        </g>
      )}
      {STAGE_LETTERS.map((l) => (
        <text
          key={l.ch}
          x={l.x}
          y={l.y}
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          textAnchor="middle"
          fontFamily={FONT_FAMILY}
          fontWeight={800}
          fontSize={STAGE_FONT_SIZE}
          fill={GOLD}
          stroke={hasOutline ? OUTLINE : undefined}
          strokeWidth={hasOutline ? 1.1 : undefined}
        >
          {l.ch}
        </text>
      ))}
    </svg>
  )
}
