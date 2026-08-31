/**
 * 랜딩 인트로 전용 워드마크. NEAR는 곧게, STAGE는 무대가 NEAR를
 * 아래에서 감싸듯 깊게 파인 곡선을 따라 배치합니다(SVG textPath).
 * 양 끝(S, E)이 NEAR 옆까지 올라와 무대가 글자를 품는 모양을 만듭니다.
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
    <svg viewBox="0 0 340 260" className={className} role="img" aria-label="NEAR:STAGE">
      <path id="stage-arc" d="M 50 122 Q 170 232 290 122" fill="none" />
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
        fontSize="46"
        fill={stageColor}
        letterSpacing="11"
      >
        <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">
          STAGE
        </textPath>
      </text>
    </svg>
  )
}
