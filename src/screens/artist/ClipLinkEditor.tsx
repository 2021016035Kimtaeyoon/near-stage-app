import { ExternalLink, Plus, Upload, Video, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { TextInput } from '@/components/ui/Field'
import type { NewClip } from '@/hooks/useClips'
import {
  MAX_CLIPS,
  MAX_CLIP_SECONDS,
  clipUploadHint,
  uploadClip,
  validateClipFile,
} from '@/lib/uploadClip'
import { clipThumbnail, validateClipUrl } from './artistDraft'

/**
 * 클립 등록 — 영상 파일을 올리거나, 외부 링크를 붙입니다.
 *
 * ★ 파일 업로드는 원래 받지 않기로 했었습니다(저작권 책임이 우리에게 오고 저장
 *   비용도 큽니다). 사장님 요청으로 열되, 두 가지를 지킵니다.
 *   - 60초·30MB 제한을 브라우저에서 먼저 막습니다. 다 올린 뒤 거절하면 사용자는
 *     모바일 데이터를 30MB 다 쓰고 실패를 봅니다.
 *   - 운영자가 신고받은 클립을 지울 수 있게 DB 정책을 열어뒀습니다(0014).
 *
 * 링크 클립은 임베드하지 않고 원본으로 보냅니다. 각 플랫폼의 임베드 정책이 자주
 * 바뀌어서, 어느 날 조용히 재생이 막히는 것보다 원본으로 보내는 편이 오래 갑니다.
 */
export function ClipLinkEditor({
  clips,
  onChange,
  userId,
  max = MAX_CLIPS,
}: {
  clips: NewClip[]
  onChange: (next: NewClip[]) => void
  /** 로그인 전에는 업로드를 못 합니다 — Storage 경로가 사용자 id 로 시작합니다 */
  userId: string | null
  max?: number
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const full = clips.length >= max

  const addLink = () => {
    const v = draft.trim()
    const invalid = validateClipUrl(v)
    if (invalid) {
      setError(invalid)
      return
    }
    if (clips.some((c) => c.url === v)) {
      setError('이미 넣은 링크예요')
      return
    }
    setError(undefined)
    onChange([...clips, { kind: 'link', url: v, thumbUrl: clipThumbnail(v) }])
    setDraft('')
  }

  const pickFile = async (file: File) => {
    if (!userId) {
      setError('영상은 로그인한 뒤에 올릴 수 있어요')
      return
    }
    const invalid = validateClipFile(file)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(undefined)
    setBusy(true)
    setProgress(0)
    try {
      const up = await uploadClip(userId, file, setProgress)
      onChange([
        ...clips,
        {
          kind: 'upload',
          url: up.url,
          thumbUrl: up.thumbUrl,
          durationSec: up.durationSec,
          title: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
        },
      ])
    } catch (e) {
      setError(clipUploadHint(e instanceof Error ? e.message : '올리지 못했어요'))
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  return (
    <div>
      {clips.length > 0 && (
        <ul className="mb-2 space-y-2">
          {clips.map((c) => (
            <li
              key={c.url}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2"
            >
              {c.thumbUrl ? (
                <img
                  src={c.thumbUrl}
                  alt=""
                  loading="lazy"
                  className="h-12 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3">
                  <Video size={16} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">
                  {c.kind === 'upload' ? (c.title || '올린 영상') : c.url}
                </p>
                <p className="tnum mt-0.5 text-2xs text-ink-3">
                  {c.kind === 'upload'
                    ? `올린 영상${c.durationSec ? ` · ${c.durationSec}초` : ''}`
                    : '외부 링크'}
                </p>
              </div>
              {c.kind === 'link' && (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="원본 열기"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3"
                >
                  <ExternalLink size={13} />
                </a>
              )}
              <button
                type="button"
                aria-label="삭제"
                onClick={() => onChange(clips.filter((x) => x.url !== c.url))}
                className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void pickFile(f)
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface text-sm font-bold text-ink disabled:opacity-50"
          >
            <Upload size={16} />
            {busy ? `올리는 중 ${Math.round(progress * 100)}%` : '영상 올리기'}
          </button>

          <div className="mt-2 flex gap-2">
            <div className="min-w-0 flex-1">
              <TextInput
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setError(undefined)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLink()
                  }
                }}
                placeholder="또는 유튜브·인스타 주소 붙여넣기"
              />
            </div>
            <button
              type="button"
              onClick={addLink}
              disabled={!draft.trim()}
              aria-label="링크 추가"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface text-ink disabled:opacity-35"
            >
              <Plus size={17} />
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-1.5 text-2xs font-semibold text-danger">{error}</p>}

      <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
        최대 {max}개 · 올린 영상은 {MAX_CLIP_SECONDS}초, 30MB 이하만 됩니다. 관객의 클립 탭과
        공연 화면에 그대로 노출됩니다. 저작권 책임은 올린 분에게 있고, 신고가 들어오면
        운영자가 내릴 수 있습니다.
      </p>
    </div>
  )
}
