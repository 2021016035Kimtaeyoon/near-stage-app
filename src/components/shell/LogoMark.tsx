/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 193"
      className={className}
      role="img"
      aria-label="NEAR:STAGE"
    >
      <rect x="3" y="3" width="294" height="187" rx="10" fill="#5B84DE" stroke="#E2E2E8" strokeWidth="4" />
      <text
        x="150"
        y="92"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="62"
        fill="#0A0A0F"
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
        fill="#FFFFFF"
        letterSpacing="3"
        transform="rotate(-7 150 132)"
      >
        STAGE
      </text>
    </svg>
  )
}
