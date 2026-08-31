/**
 * 랜딩 인트로 전용 워드마크. NEAR는 곧게, STAGE는 무대 앞줄처럼
 * 아래로 둥글게 휘어지는 곡선을 따라 배치합니다(SVG textPath).
 * 다른 화면에서 쓰는 평면 LogoMark와는 별개의, 이 장면 전용 연출입니다.
 */
export function StageWordmark({
  className,
  stageColor = '#FF5560',
}: {
  className?: string
  stageColor?: string
}) {
  return (
    <svg viewBox="0 0 340 230" className={className} role="img" aria-label="NEAR:STAGE">
      <path id="stage-arc" d="M 44 152 Q 170 202 296 152" fill="none" />
      <text
        x="170"
        y="92"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="66"
        fill="#FFFFFF"
        letterSpacing="-1"
      >
        NEAR
      </text>
      <text
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={800}
        fontStyle="italic"
        fontSize="42"
        fill={stageColor}
        letterSpacing="4"
      >
        <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
          STAGE
        </textPath>
      </text>
    </svg>
  )
}
