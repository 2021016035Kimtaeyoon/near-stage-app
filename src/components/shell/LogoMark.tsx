interface Props {
  className?: string
  /** 어두운 배경(랜딩 인트로, 푸터 등) 위에 놓일 때 — 검정 요소를 흰색으로 반전 */
  dark?: boolean
}

/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 * NEAR는 곧게 짜여 있고, 그 아래 두 겹 곡선 트랙 사이로 STAGE가
 * 금색 + 레드 그림자 겹침으로 곡선을 따라 흐릅니다(SVG textPath).
 */
export function LogoMark({ className, dark = false }: Props) {
  const lineColor = dark ? '#FFFFFF' : '#0A0A0F'
  return (
    <svg viewBox="0 0 340 250" className={className} role="img" aria-label="NEAR:STAGE">
      <path id="stage-arc" d="M 47 113 Q 170 189 295 113" fill="none" />
      <path d="M 35 105 Q 170 200 305 105" fill="none" stroke={lineColor} strokeWidth="3" />
      <path d="M 55 122 Q 170 178 285 122" fill="none" stroke={lineColor} strokeWidth="3" />

      <text
        x="170"
        y="68"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="46"
        fill={lineColor}
        letterSpacing="10"
      >
        NEAR
      </text>

      <g transform="translate(3,4)">
        <text
          fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
          fontWeight={800}
          fontSize="36"
          fill="#A9291C"
          letterSpacing="3"
        >
          <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
            STAGE
          </textPath>
        </text>
      </g>
      <text
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={800}
        fontSize="36"
        fill="#F5C518"
        stroke="#0A0A0F"
        strokeWidth="1"
        letterSpacing="3"
      >
        <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
          STAGE
        </textPath>
      </text>
    </svg>
  )
}
