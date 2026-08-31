interface Props {
  className?: string
  /** 어두운 배경(랜딩 인트로, 푸터 등) 위에 놓일 때 — NEAR를 흰색으로 반전 */
  dark?: boolean
}

/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 * NEAR는 곧게, STAGE는 무대가 NEAR를 아래에서 감싸듯 깊게 파인
 * 곡선을 따라(SVG textPath) 이탤릭으로 흐르며, 배경 플레이트는 없습니다.
 */
export function LogoMark({ className, dark = false }: Props) {
  return (
    <svg viewBox="0 0 340 260" className={className} role="img" aria-label="NEAR:STAGE">
      <path id="stage-arc" d="M 50 122 Q 170 232 290 122" fill="none" />
      <text
        x="170"
        y="92"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="66"
        fill={dark ? '#FFFFFF' : '#0A0A0F'}
        letterSpacing="-1"
      >
        NEAR
      </text>
      <text
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={800}
        fontStyle="italic"
        fontSize="46"
        fill="#FF5560"
        letterSpacing="11"
      >
        <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
          STAGE
        </textPath>
      </text>
    </svg>
  )
}
