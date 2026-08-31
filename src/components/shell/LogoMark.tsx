interface Props {
  className?: string
  /** 어두운 배경(랜딩 인트로, 푸터 등) 위에 놓일 때 — 배경 없이도 대비가 유지되도록 색을 반전 */
  dark?: boolean
}

const STAGE_LETTERS: Array<{ char: string; x: number; y: number }> = [
  { char: 'S', x: 81, y: 205 },
  { char: 'T', x: 136, y: 219 },
  { char: 'A', x: 200, y: 224 },
  { char: 'G', x: 264, y: 219 },
  { char: 'E', x: 319, y: 205 },
]

/**
 * NEAR:STAGE 워드마크. 외부 이미지 파일 없이 SVG로 그려서
 * 어떤 배율에서도 또렷하게 보이고 오프라인에서도 항상 렌더링됩니다.
 * NEAR를 감싸는 타원 링 아래로 STAGE 글자가 무대 곡선을 따라 놓입니다.
 * 글자 자체는 기울이지 않고 위치만 곡선을 따라 배치해 또렷하게 읽힙니다.
 */
export function LogoMark({ className, dark = false }: Props) {
  const color = dark ? '#FFFFFF' : '#0A0A0F'
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="NEAR:STAGE">
      <ellipse cx="200" cy="148" rx="178" ry="76" fill="none" stroke={color} strokeWidth="4" />
      <text
        x="200"
        y="176"
        textAnchor="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontWeight={900}
        fontSize="102"
        fill={color}
        letterSpacing="-2"
      >
        NEAR
      </text>
      {STAGE_LETTERS.map((l) => (
        <text
          key={l.char}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
          fontWeight={700}
          fontSize="30"
          fill={color}
        >
          {l.char}
        </text>
      ))}
    </svg>
  )
}
