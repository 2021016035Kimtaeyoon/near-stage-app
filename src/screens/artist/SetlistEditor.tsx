import { ChevronDown, ChevronUp, GripVertical, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { TextInput } from '@/components/ui/Field'

/**
 * 셋리스트 편집 — 추가 / 삭제 / 순서 변경 (§8-2).
 *
 * 순서를 드래그가 아니라 위·아래 버튼으로 바꿉니다. 드래그는 모바일에서 스크롤과
 * 싸우고, 항목이 몇 개 안 되는 목록에서는 버튼이 더 확실합니다.
 */
export function SetlistEditor({
  items,
  onChange,
  max = 12,
  placeholder = '예) 오프닝 - 첫 곡',
}: {
  items: string[]
  onChange: (next: string[]) => void
  max?: number
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v || items.length >= max) return
    onChange([...items, v])
    setDraft('')
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      {items.length > 0 && (
        <ol className="mb-2 space-y-1.5">
          {items.map((it, i) => (
            <li
              key={`${it}-${i}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
            >
              <GripVertical size={13} className="shrink-0 text-ink-3" />
              <span className="tnum w-4 shrink-0 text-2xs font-bold text-ink-3">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{it}</span>
              <button
                type="button"
                aria-label="위로"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="tap flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 disabled:opacity-25"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                aria-label="아래로"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                className="tap flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 disabled:opacity-25"
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                aria-label="삭제"
                onClick={() => onChange(items.filter((_, k) => k !== i))}
                className="tap flex h-7 w-7 items-center justify-center rounded-lg text-ink-3"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ol>
      )}

      {items.length < max && (
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <TextInput
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  add()
                }
              }}
              placeholder={placeholder}
              maxLength={60}
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

      <p className="tnum mt-1.5 text-2xs text-ink-3">
        {items.length}/{max} · 순서는 위아래 버튼으로 바꿉니다
      </p>
    </div>
  )
}
