import { useEffect, useState } from 'react'
import { Chip } from './Chip'
import { TextInput } from './Field'

export const OTHER = '기타'

/**
 * 보기 + 기타 직접 입력.
 *
 * 목록으로 세상을 다 담을 수 없습니다. 공간은 복합문화공간·서점·공방일 수 있고,
 * 장르는 판소리·마임·인형극일 수 있습니다. 보기에 없으면 등록을 포기하거나 엉뚱한
 * 항목을 고르게 되는데, 둘 다 데이터를 망칩니다.
 *
 * '기타'를 누르면 입력칸이 열리고, 입력한 값이 그대로 저장됩니다. DB 컬럼이
 * text/text[] 라 우리 목록에 없는 값도 그대로 들어갑니다.
 */
export function SingleChoiceWithOther({
  options,
  value,
  onChange,
  placeholder = '직접 입력',
  maxLength = 20,
}: {
  options: readonly string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}) {
  // 저장된 값이 보기에 없으면 '기타'로 들어온 값입니다
  const isOther = value !== '' && !options.includes(value)
  const [otherOpen, setOtherOpen] = useState(isOther)

  useEffect(() => {
    if (isOther) setOtherOpen(true)
  }, [isOther])

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip
            key={o}
            active={value === o}
            onClick={() => {
              setOtherOpen(false)
              onChange(o)
            }}
          >
            {o}
          </Chip>
        ))}
        <Chip
          active={otherOpen}
          onClick={() => {
            setOtherOpen(true)
            // 보기 중 하나가 골라져 있었으면 비워서 입력을 유도합니다
            if (!isOther) onChange('')
          }}
        >
          {OTHER}
        </Chip>
      </div>

      {otherOpen && (
        <div className="mt-2">
          <TextInput
            autoFocus
            value={isOther ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        </div>
      )}
    </div>
  )
}

/**
 * 여러 개 고르기 + 기타 직접 입력.
 * 기타로 넣은 값들은 목록과 함께 그대로 저장됩니다.
 */
export function MultiChoiceWithOther({
  options,
  values,
  onChange,
  renderOption,
  placeholder = '쉼표로 여러 개 입력 (예: 판소리, 마임)',
}: {
  options: readonly string[]
  values: string[]
  onChange: (next: string[]) => void
  /** 장르 태그처럼 특별한 모양으로 그려야 할 때 */
  renderOption?: (option: string, active: boolean) => React.ReactNode
  placeholder?: string
}) {
  const customs = values.filter((v) => !options.includes(v))
  const [otherOpen, setOtherOpen] = useState(customs.length > 0)
  const [draft, setDraft] = useState(customs.join(', '))

  useEffect(() => {
    if (customs.length > 0) setOtherOpen(true)
  }, [customs.length])

  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o])

  /** 입력칸의 쉼표 목록을 그대로 값에 반영합니다 */
  const commitCustoms = (raw: string) => {
    setDraft(raw)
    const typed = raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    const picked = values.filter((v) => options.includes(v))
    onChange([...picked, ...typed])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o)
          return renderOption ? (
            <button key={o} type="button" onClick={() => toggle(o)} className="tap">
              {renderOption(o, active)}
            </button>
          ) : (
            <Chip key={o} active={active} onClick={() => toggle(o)}>
              {o}
            </Chip>
          )
        })}
        <Chip active={otherOpen} onClick={() => setOtherOpen((v) => !v)}>
          {OTHER}
        </Chip>
      </div>

      {otherOpen && (
        <div className="mt-2">
          <TextInput
            value={draft}
            onChange={(e) => commitCustoms(e.target.value)}
            placeholder={placeholder}
            maxLength={80}
          />
          {customs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {customs.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-2xs font-semibold text-ink-2"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
