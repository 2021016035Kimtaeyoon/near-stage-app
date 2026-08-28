import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Label, TextInput } from '@/components/ui/Field'

/** 셋리스트 편집 — 추가/삭제/순서변경(위아래 이동) */
export function SetlistEditor({
  setlist,
  onChange,
}: {
  setlist: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= setlist.length) return
    const next = setlist.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const remove = (i: number) => onChange(setlist.filter((_, idx) => idx !== i))

  const add = () => {
    if (!draft.trim()) return
    onChange([...setlist, draft.trim()])
    setDraft('')
  }

  return (
    <div>
      <Label hint={`${setlist.length}곡`}>셋리스트</Label>
      <div className="space-y-1.5">
        {setlist.map((s, i) => (
          <div key={`${s}-${i}`} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-2">
            <span className="tnum w-4 shrink-0 text-xs text-ink-3">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{s}</span>
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="위로"
              className="tap flex items-center justify-center text-ink-3 disabled:opacity-25"
            >
              <ChevronUp size={15} />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === setlist.length - 1}
              aria-label="아래로"
              className="tap flex items-center justify-center text-ink-3 disabled:opacity-25"
            >
              <ChevronDown size={15} />
            </button>
            <button onClick={() => remove(i)} aria-label="삭제" className="tap flex items-center justify-center text-danger">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="곡 제목 추가"
          className="flex-1"
        />
        <button
          onClick={add}
          aria-label="곡 추가"
          className="tap flex items-center justify-center rounded-xl border border-border-strong bg-surface-2 px-3"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
