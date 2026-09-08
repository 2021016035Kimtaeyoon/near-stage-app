import { Camera, RotateCcw, Ruler } from 'lucide-react'
import { useRef, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { cn } from '@/lib/cn'
import { validatePhotoFile } from '@/lib/uploadPhoto'
import { toast } from '@/store/useToast'

/**
 * 사진으로 길이 재기.
 *
 * ★ 사진을 "분석"해서 치수를 추정하지 않습니다. 사진 한 장에는 깊이 정보가 없어서
 *   추정값은 근거 없는 숫자가 되고, 그걸 그대로 제출하면 매칭이 망가집니다
 *   (천장 2.4m 공간에 3m 장비를 들고 오는 팀이 생깁니다).
 *
 * 대신 사진 안에서 **실제로 재게** 합니다. 높이를 아는 기준 대상(문·사람·의자)을
 * 두 점으로 찍어 픽셀 길이를 얻고, 재려는 대상도 두 점으로 찍어 비례식으로 계산합니다.
 *
 *     실제길이 = 기준실제높이 × (대상픽셀 ÷ 기준픽셀)
 *
 * 사장님이 무엇을 기준으로 어디를 쟀는지 눈으로 보기 때문에, 숫자가 틀리면 바로
 * 압니다. 근거가 있는 "대충"입니다.
 *
 * 한계: 기준 대상과 재려는 대상이 카메라에서 비슷한 거리에 있어야 맞습니다. 화면에
 * 그렇게 적어둡니다.
 */

interface Reference {
  key: string
  label: string
  meters: number
  hint: string
}

const REFERENCES: Reference[] = [
  { key: 'door', label: '문', meters: 2.0, hint: '일반 실내문 높이 약 2m' },
  { key: 'person', label: '사람', meters: 1.7, hint: '서 있는 성인 약 1.7m' },
  { key: 'chair', label: '의자', meters: 0.45, hint: '앉는 면까지 약 0.45m' },
  { key: 'desk', label: '책상·테이블', meters: 0.73, hint: '테이블 높이 약 0.73m' },
]

type Phase = 'pick' | 'reference' | 'target' | 'done'
interface Point {
  x: number
  y: number
}

export function PhotoMeasureSheet({
  open,
  onClose,
  /** 무엇을 재는지 — 화면 문구와 결과 반영 대상이 달라집니다 */
  what,
  onResult,
  /** 재는 데 쓴 사진을 공간 사진으로도 쓸 수 있게 넘겨줍니다 */
  onUsePhoto,
}: {
  open: boolean
  onClose: () => void
  what: '천장 높이' | '무대 가로'
  onResult: (meters: number) => void
  onUsePhoto?: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [ref, setRef] = useState<Reference>(REFERENCES[0])
  const [phase, setPhase] = useState<Phase>('pick')
  const [refPts, setRefPts] = useState<Point[]>([])
  const [targetPts, setTargetPts] = useState<Point[]>([])

  const reset = () => {
    setPhase(file ? 'reference' : 'pick')
    setRefPts([])
    setTargetPts([])
  }

  const pickFile = (f: File | null) => {
    if (!f) return
    const invalid = validatePhotoFile(f)
    if (invalid) {
      toast(invalid, 'error')
      return
    }
    if (url) URL.revokeObjectURL(url)
    setFile(f)
    setUrl(URL.createObjectURL(f))
    setPhase('reference')
    setRefPts([])
    setTargetPts([])
  }

  /** 이미지 위 클릭 좌표를 0~1 비율로 저장합니다 (표시 크기가 바뀌어도 유지되도록) */
  const addPoint = (e: React.MouseEvent<HTMLImageElement>) => {
    const el = imgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const p = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }

    if (phase === 'reference') {
      const next = [...refPts, p].slice(-2)
      setRefPts(next)
      if (next.length === 2) setPhase('target')
      return
    }
    if (phase === 'target') {
      const next = [...targetPts, p].slice(-2)
      setTargetPts(next)
      if (next.length === 2) setPhase('done')
    }
  }

  // 화면에 보이는 크기와 무관하게 비율로 계산합니다.
  // 세로/가로 비율이 다르므로 실제 픽셀 크기를 곱해 길이를 구합니다.
  const natural = imgRef.current
    ? { w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight }
    : { w: 1, h: 1 }
  const len = (pts: Point[]) => {
    if (pts.length < 2) return 0
    const dx = (pts[1].x - pts[0].x) * natural.w
    const dy = (pts[1].y - pts[0].y) * natural.h
    return Math.sqrt(dx * dx + dy * dy)
  }
  const refLen = len(refPts)
  const targetLen = len(targetPts)
  const meters = refLen > 0 ? (ref.meters * targetLen) / refLen : 0

  const instruction: Record<Phase, string> = {
    pick: '공간 사진을 한 장 올려주세요',
    reference: `사진에서 ${ref.label}의 아래와 위를 차례로 눌러주세요`,
    target: `이제 ${what}의 양 끝을 차례로 눌러주세요`,
    done: '',
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`사진으로 ${what} 재기`}
      subtitle="사진 속 기준 대상과 비교해 길이를 계산합니다"
      footer={
        phase === 'done' ? (
          <div className="flex gap-2">
            <Button variant="ghost" leading={<RotateCcw size={15} />} onClick={reset}>
              다시
            </Button>
            <Button
              variant="brand"
              full
              onClick={() => {
                onResult(Math.round(meters * 10) / 10)
                if (file && onUsePhoto) onUsePhoto(file)
                onClose()
              }}
            >
              {meters.toFixed(1)}m 로 입력
            </Button>
          </div>
        ) : undefined
      }
    >
      {!url ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface"
        >
          <Camera size={26} className="text-ink-3" />
          <span className="text-sm font-bold">사진 찍기 · 고르기</span>
          <span className="text-2xs text-ink-3">이 사진은 공간 사진으로도 함께 등록됩니다</span>
        </button>
      ) : (
        <>
          <div>
            <p className="mb-2 text-xs font-bold">기준 대상</p>
            <div className="flex flex-wrap gap-1.5">
              {REFERENCES.map((r) => (
                <Chip
                  key={r.key}
                  active={ref.key === r.key}
                  onClick={() => {
                    setRef(r)
                    reset()
                  }}
                >
                  {r.label} {r.meters}m
                </Chip>
              ))}
            </div>
            <p className="mt-1.5 text-2xs text-ink-3">{ref.hint}</p>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-2xl bg-surface-3">
            <img
              ref={imgRef}
              src={url}
              alt=""
              onClick={addPoint}
              className={cn('block w-full', phase !== 'done' && 'cursor-crosshair')}
            />
            <Overlay points={refPts} color="#38BDF8" label={ref.label} />
            <Overlay points={targetPts} color="rgb(255,196,46)" label={what} />
          </div>

          {phase !== 'done' ? (
            <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs font-semibold leading-relaxed text-ink-2">
              {instruction[phase]}
            </p>
          ) : (
            <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-extrabold">
                <Ruler size={15} className="text-gold-text" />
                {what} 약 {meters.toFixed(1)}m
              </p>
              <p className="tnum mt-1.5 text-2xs leading-relaxed text-ink-3">
                {ref.label} {ref.meters}m 를 기준으로 계산했습니다 (기준 {Math.round(refLen)}px ·
                대상 {Math.round(targetLen)}px)
              </p>
            </div>
          )}

          <p className="mt-3 text-2xs leading-relaxed text-ink-3">
            기준 대상과 재려는 곳이 카메라에서 비슷한 거리에 있을 때 가장 정확합니다. 값이
            이상하면 다시 재거나 직접 입력하세요.
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
    </BottomSheet>
  )
}

/** 찍은 두 점과 그 사이 선 */
function Overlay({ points, color, label }: { points: Point[]; color: string; label: string }) {
  if (points.length === 0) return null
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {points.length === 2 && (
        <line
          x1={points[0].x * 100}
          y1={points[0].y * 100}
          x2={points[1].x * 100}
          y2={points[1].y * 100}
          stroke={color}
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x * 100}
          cy={p.y * 100}
          r="1.1"
          fill={color}
          stroke="#0A0A0D"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {points.length === 2 && (
        <text
          x={((points[0].x + points[1].x) / 2) * 100}
          y={((points[0].y + points[1].y) / 2) * 100 - 2}
          fill={color}
          fontSize="3.4"
          fontWeight="700"
          textAnchor="middle"
          style={{ paintOrder: 'stroke', stroke: '#0A0A0D', strokeWidth: 1 }}
        >
          {label}
        </text>
      )}
    </svg>
  )
}
