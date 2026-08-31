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
 * viewBox는 참고 이미지의 실제 픽셀 비율(336x260)에 맞췄습니다.
 */
export function LogoMark({ className, dark = false }: Props) {
  const lineColor = dark ? '#FFFFFF' : '#0A0A0F'
  return (
    <svg viewBox="0 0 336 260" className={className} role="img" aria-label="NEAR:STAGE">
      <path id="stage-arc" d="M 42 134 Q 168 199 294 134" fill="none" />
      <path d="M 58 118 Q 168 172 278 118" fill="none" stroke={lineColor} strokeWidth="3.5" />
      <path d="M 26 150 Q 168 226 310 150" fill="none" stroke={lineColor} strokeWidth="3.5" />

      <text
        x="168"
        y="100"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="50"
        fill={lineColor}
        letterSpacing="13"
      >
        NEAR
      </text>

      <g transform="translate(3,5)">
        <text
          fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
          fontWeight={800}
          fontSize="34"
          fill="#A9291C"
          letterSpacing="11"
        >
          <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
            STAGE
          </textPath>
        </text>
      </g>
      <text
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={800}
        fontSize="34"
        fill="#F5C518"
        stroke="#0A0A0F"
        strokeWidth="1"
        letterSpacing="11"
      >
        <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
          STAGE
        </textPath>
      </text>
    </svg>
  )
}
