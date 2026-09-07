import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import {
  MAX_PHOTOS,
  deletePhoto,
  pathFromPublicUrl,
  uploadPhoto,
  validatePhotoFile,
  type PhotoBucket,
} from '@/lib/uploadPhoto'
import { toast } from '@/store/useToast'

/**
 * 사진 업로더.
 *
 * 여러 장을 골라도 하나씩 순서대로 올립니다. 동시에 올리면 실패한 장이 어느 것인지
 * 알기 어렵고, 진행률도 뒤섞입니다.
 */
export function PhotoUploader({
  bucket,
  photos,
  onChange,
  max = MAX_PHOTOS,
}: {
  bucket: PhotoBucket
  photos: string[]
  onChange: (next: string[]) => void
  max?: number
}) {
  const userId = useAuthStore((s) => s.userId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; ratio: number } | null>(
    null,
  )

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!userId) {
      toast('로그인이 필요해요', 'warn')
      return
    }
    const room = max - photos.length
    if (room <= 0) {
      toast(`사진은 최대 ${max}장까지 올릴 수 있어요`, 'warn')
      return
    }

    const chosen = Array.from(files).slice(0, room)
    if (files.length > room) {
      toast(`${room}장만 올립니다`, 'warn', `최대 ${max}장까지 가능해요`)
    }

    setBusy(true)
    const added: string[] = []
    for (let i = 0; i < chosen.length; i++) {
      const file = chosen[i]
      const invalid = validatePhotoFile(file)
      if (invalid) {
        toast(invalid, 'error', file.name)
        continue
      }
      setProgress({ done: i, total: chosen.length, ratio: 0 })
      try {
        const { url } = await uploadPhoto(bucket, userId, file, (r) =>
          setProgress({ done: i, total: chosen.length, ratio: r }),
        )
        added.push(url)
      } catch (e) {
        toast('사진을 올리지 못했어요', 'error', e instanceof Error ? e.message : file.name)
      }
    }
    setBusy(false)
    setProgress(null)
    if (added.length > 0) onChange([...photos, ...added])
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = async (url: string) => {
    onChange(photos.filter((u) => u !== url))
    // 저장소에서도 지웁니다 — 안 지우면 안 쓰는 파일이 용량만 차지합니다
    const path = pathFromPublicUrl(bucket, url)
    if (path) await deletePhoto(bucket, path)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => void remove(url)}
              aria-label="사진 삭제"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed',
              busy ? 'border-border bg-surface-2' : 'border-border-strong bg-surface',
            )}
          >
            {busy ? (
              <Loader2 size={20} className="animate-spin text-ink-3" />
            ) : (
              <ImagePlus size={20} className="text-ink-3" />
            )}
            <span className="text-2xs font-semibold text-ink-3">
              {busy ? '올리는 중' : '사진 추가'}
            </span>
          </button>
        )}
      </div>

      {progress && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="bg-gold-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${Math.round(((progress.done + progress.ratio) / progress.total) * 100)}%` }}
            />
          </div>
          <p className="tnum mt-1 text-2xs text-ink-3">
            {progress.done + 1} / {progress.total}장 올리는 중
          </p>
        </div>
      )}

      <p className="mt-2 text-2xs leading-relaxed text-ink-3">
        최대 {max}장 · JPG·PNG·WebP · 5MB 이하. 올릴 때 자동으로 크기를 줄여 저장합니다.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => void pick(e.target.files)}
      />
    </div>
  )
}
