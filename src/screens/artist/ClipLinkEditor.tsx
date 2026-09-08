import { ExternalLink, Plus, Video, X } from 'lucide-react'
import { useState } from 'react'
import { TextInput } from '@/components/ui/Field'
import { clipThumbnail, validateClipUrl } from './artistDraft'

/**
 * 영상 링크 (§11).
 *
 * ★ 영상 파일은 받지 않습니다. 저장 비용도 크지만, 더 큰 이유는 저작권입니다.
 *   업로드를 받으면 우리가 저작물을 호스팅하는 주체가 되고, 문제가 생겼을 때
 *   책임이 우리에게 옵니다. 링크만 받으면 원본은 유튜브·인스타그램에 남습니다.
 *
 * 유튜브는 videoId 를 뽑아 썸네일을 보여주고, 다른 플랫폼은 링크만 카드로 둡니다.
 * 임베드(iframe)를 쓰지 않는 이유는 각 플랫폼의 임베드 정책이 자주 바뀌기 때문입니다 —
 * 어느 날 조용히 재생이 막히는 것보다, 새 탭에서 원본으로 보내는 편이 오래 갑니다.
 */
export function ClipLinkEditor({
  urls,
  onChange,
  max = 3,
}: {
  urls: string[]
  onChange: (next: string[]) => void
  max?: number
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | undefined>()

  const add = () => {
    const v = draft.trim()
    const invalid = validateClipUrl(v)
    if (invalid) {
      setError(invalid)
      return
    }
    if (urls.includes(v)) {
      setError('이미 넣은 링크예요')
      return
    }
    setError(undefined)
    onChange([...urls, v])
    setDraft('')
  }

  return (
    <div>
      {urls.length > 0 && (
        <ul className="mb-2 space-y-2">
          {urls.map((u) => {
            const thumb = clipThumbnail(u)
            return (
              <li
                key={u}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="h-12 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3">
                    <Video size={16} />
                  </span>
                )}
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-1 text-xs text-ink-2"
                >
                  <span className="truncate">{u}</span>
                  <ExternalLink size={11} className="shrink-0" />
                </a>
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => onChange(urls.filter((x) => x !== u))}
                  className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3"
                >
                  <X size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {urls.length < max && (
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <TextInput
              value={draft}
              error={error}
              onChange={(e) => {
                setDraft(e.target.value)
                setError(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  add()
                }
              }}
              placeholder="유튜브·인스타그램 영상 주소 붙여넣기"
            />
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            aria-label="추가"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface text-ink disabled:opacity-35"
          >
            <Plus size={17} />
          </button>
        </div>
      )}

      <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
        최대 {max}개 · 영상 파일은 올리지 않습니다. 링크만 저장하고 누르면 원본으로
        이동합니다. 올리신 영상의 저작권 책임은 게시자에게 있습니다.
      </p>
    </div>
  )
}
