import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'

/** 문자열을 QR 이미지로 그립니다. 흰 배경 고정 — 카메라가 어떤 테마에서도 읽어야 합니다 */
export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setError(false)
    QRCode.toCanvas(canvas, value, { width: size, margin: 1 }).catch(() => setError(true))
  }, [value, size])

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-surface-2 text-2xs text-ink-3"
        style={{ width: size, height: size }}
      >
        QR을 그리지 못했어요
      </div>
    )
  }

  return <canvas ref={canvasRef} className="rounded-xl" style={{ width: size, height: size }} />
}
