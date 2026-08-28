import { Camera, Plus } from 'lucide-react'
import { PosterArt } from '@/components/ui/PosterArt'
import { toast } from '@/store/useToast'
import type { Genre } from '@/types'

/** 사진 슬롯 4칸 — 실제 업로드 대신 플레이스홀더. 탭하면 채워진 것처럼 표시 */
export function PhotoSlots({
  seed,
  genre,
  filled,
  onAdd,
}: {
  seed: string
  genre: Genre
  filled: number
  onAdd: () => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-2">사진 ({filled}/4)</span>
        <span className="text-2xs text-ink-3">탭해서 슬롯 채우기</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => {
          const isFilled = i < filled
          return (
            <button
              key={i}
              onClick={() => {
                if (isFilled) {
                  toast('사진을 교체했습니다', 'success')
                } else {
                  onAdd()
                }
              }}
              className="relative aspect-square overflow-hidden rounded-xl border border-border"
            >
              {isFilled ? (
                <PosterArt seed={`${seed}-photo-${i}`} genre={genre} className="h-full w-full" glyphScale={0.7} />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-2 text-ink-3">
                  <Plus size={16} />
                  <Camera size={12} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
