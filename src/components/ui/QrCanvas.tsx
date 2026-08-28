import { useEffect, useRef } from 'react'
import { makeRng } from '@/lib/rng'

/**
 * 외부 QR 라이브러리 없이 canvas로 그리는 결정론적 QR 느낌의 패턴.
 * 실제로 스캔되는 QR코드는 아니지만, 같은 시드는 항상 같은 패턴을 그립니다
 * (오프라인에서도 100% 동작, 새로고침해도 티켓 모양이 바뀌지 않음).
 */
export function QrCanvas({ seed, size = 176 }: { seed: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, size, size)

    const grid = 21
    const cell = size / grid
    const rng = makeRng(seed)

    ctx.fillStyle = '#17171C'

    // 파인더 패턴 (세 모서리의 사각 틀) — QR코드의 상징적인 모양을 흉내
    const drawFinder = (gx: number, gy: number) => {
      ctx.fillRect(gx * cell, gy * cell, 7 * cell, 7 * cell)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect((gx + 1) * cell, (gy + 1) * cell, 5 * cell, 5 * cell)
      ctx.fillStyle = '#17171C'
      ctx.fillRect((gx + 2) * cell, (gy + 2) * cell, 3 * cell, 3 * cell)
    }
    drawFinder(0, 0)
    drawFinder(grid - 7, 0)
    drawFinder(0, grid - 7)

    // 나머지 칸은 시드 기반 난수로 채워 항상 같은 패턴을 만듭니다
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const inFinder =
          (x < 8 && y < 8) || (x > grid - 9 && y < 8) || (x < 8 && y > grid - 9)
        if (inFinder) continue
        if (rng() > 0.56) {
          ctx.fillRect(x * cell, y * cell, cell, cell)
        }
      }
    }
  }, [seed, size])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="예약 확인용 QR 패턴"
      style={{ width: size, height: size }}
      className="rounded-lg"
    />
  )
}
