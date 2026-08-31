import { ARC_LOWER, ARC_UPPER, LOGO_VIEWBOX, NEAR, STAGE_FONT_SIZE, STAGE_LETTERS } from './logoGeometry'

interface Props {
  className?: string
  /** 어두운 배경(랜딩 인트로, 푸터 등) 위에 놓일 때 — 검정 요소를 흰색으로 반전 */
  dark?: boolean
}

const FONT_FAMILY = 'Pretendard Variable, Pretendard, -apple-system, sans-serif'

/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 * STAGE 글자 5개는 logoGeometry.ts에 손으로 고정한 좌표/회전값을 그대로
 * 쓰고, textPath로 다시 흐르게 하지 않습니다(폰트 메트릭에 따라 밀림).
 */
export function LogoMark({ className, dark = false }: Props) {
  const lineColor = dark ? '#FFFFFF' : '#0A0A0F'
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label="NEAR:STAGE">
      <path d={ARC_UPPER} fill="none" stroke={lineColor} strokeWidth="3.5" />
      <path d={ARC_LOWER} fill="none" stroke={lineColor} strokeWidth="3.5" />

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

      <g transform="translate(3,5)">
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
            fill="#A9291C"
          >
            {l.ch}
          </text>
        ))}
      </g>
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
          fill="#F5C518"
          stroke="#0A0A0F"
          strokeWidth="1"
        >
          {l.ch}
        </text>
      ))}
    </svg>
  )
}
