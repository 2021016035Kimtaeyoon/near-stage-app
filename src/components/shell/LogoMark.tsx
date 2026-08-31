interface Props {
  className?: string
  /** 어두운 배경(랜딩 푸터 등) 위에 놓일 때 — 배경 없이도 대비가 유지되도록 색을 반전 */
  dark?: boolean
  /** STAGE 텍스트 색 오버라이드 — 랜딩 인트로처럼 특정 장면에서만 다른 강조색을 쓸 때 */
  stageColor?: string
}

/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 * 배경 플레이트 없이 텍스트만 놓여 어떤 배경 위에서도 자연스럽게 어울립니다.
 */
export function LogoMark({ className, dark = false, stageColor }: Props) {
  return (
    <svg
      viewBox="0 0 300 193"
      className={className}
      role="img"
      aria-label="NEAR:STAGE"
    >
      <text
        x="150"
        y="92"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="62"
        fill={dark ? '#FFFFFF' : '#0A0A0F'}
        letterSpacing="-1"
      >
        NEAR
      </text>
      <text
        x="150"
        y="148"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={800}
        fontStyle="italic"
        fontSize="44"
        fill={stageColor ?? (dark ? '#FF7FA6' : '#FF3D77')}
        letterSpacing="3"
        transform="rotate(-7 150 132)"
      >
        STAGE
      </text>
    </svg>
  )
}
