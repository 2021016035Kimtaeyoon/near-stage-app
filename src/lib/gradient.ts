import { hashSeed } from './rng'

/**
 * photoSeed → 결정론적 그라데이션.
 * 외부 이미지 요청을 0건으로 유지하기 위해, 모든 "사진"은 시드에서 계산된
 * 그라데이션 + 장르 픽토그램으로 대체합니다. 오프라인에서도 절대 깨지지 않습니다.
 */
export interface SeedGradient {
  from: string
  to: string
  angle: number
  /** 위에 겹칠 은은한 하이라이트 위치 (%) */
  glowX: number
  glowY: number
  css: string
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h} ${s}% ${l}%)`
}

export function seedGradient(seed: string): SeedGradient {
  const h = hashSeed(seed)
  const baseHue = h % 360
  const spread = 26 + ((h >> 9) % 46) // 26~71도 차이
  const secondHue = (baseHue + spread) % 360
  const angle = 100 + ((h >> 5) % 140) // 100~239도
  const from = hsl(baseHue, 58 + ((h >> 3) % 16), 26 + ((h >> 7) % 12))
  const to = hsl(secondHue, 48 + ((h >> 11) % 20), 13 + ((h >> 13) % 9))
  const glowX = 18 + ((h >> 17) % 64)
  const glowY = 12 + ((h >> 19) % 50)
  const css = [
    `radial-gradient(120% 90% at ${glowX}% ${glowY}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 58%)`,
    `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`,
  ].join(', ')
  return { from, to, angle, glowX, glowY, css }
}

/** 클립 피드처럼 더 진한 배경이 필요할 때 */
export function seedGradientDeep(seed: string): string {
  const g = seedGradient(seed)
  return [
    `radial-gradient(90% 60% at ${g.glowX}% ${g.glowY}%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 60%)`,
    `linear-gradient(${g.angle}deg, ${g.from} 0%, ${g.to} 62%, #0B0B0F 100%)`,
  ].join(', ')
}

/** 결정론적 노이즈 도트 좌표 (포스터 위 질감용) */
export function seedDots(seed: string, count = 18): Array<{ x: number; y: number; r: number; o: number }> {
  const h = hashSeed(seed)
  const out: Array<{ x: number; y: number; r: number; o: number }> = []
  let a = h
  for (let i = 0; i < count; i++) {
    a = (Math.imul(a ^ (a >>> 15), 2246822507) + i * 2654435761) >>> 0
    out.push({
      x: a % 100,
      y: (a >> 7) % 100,
      r: 0.6 + ((a >> 14) % 18) / 10,
      o: 0.05 + ((a >> 20) % 12) / 100,
    })
  }
  return out
}
