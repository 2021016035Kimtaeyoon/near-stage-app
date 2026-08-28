import { Stepper } from '@/components/ui/Field'
import { Segmented, Toggle } from '@/components/ui/Chip'
import type { NeedKey, PerformerNeed, SoundproofGrade } from '@/types'

interface Def {
  key: NeedKey
  title: string
  kind: 'boolean' | 'number' | 'soundproof'
  unit?: string
  min?: number
  max?: number
  defaultValue: number | boolean | SoundproofGrade
  labelFor: (v: number | boolean | SoundproofGrade) => string
}

const DEFS: Def[] = [
  { key: 'sound', title: '음향 시스템', kind: 'boolean', defaultValue: true, labelFor: () => '음향 시스템' },
  {
    key: 'mic',
    title: '마이크 개수',
    kind: 'number',
    unit: '개',
    min: 1,
    max: 8,
    defaultValue: 1,
    labelFor: (v) => `마이크 ${v}개`,
  },
  { key: 'piano', title: '피아노', kind: 'boolean', defaultValue: true, labelFor: () => '피아노' },
  { key: 'projector', title: '프로젝터', kind: 'boolean', defaultValue: true, labelFor: () => '프로젝터' },
  {
    key: 'stageWidthM',
    title: '무대 가로 (최소, m)',
    kind: 'number',
    unit: 'm',
    min: 1,
    max: 8,
    defaultValue: 2,
    labelFor: (v) => `무대 가로 ${v}m 이상`,
  },
  {
    key: 'ceilingHeightM',
    title: '천장 높이 (최소, m)',
    kind: 'number',
    unit: 'm',
    min: 2,
    max: 6,
    defaultValue: 3,
    labelFor: (v) => `천장 ${v}m 이상`,
  },
  {
    key: 'powerKw',
    title: '전원 용량 (최소, kW)',
    kind: 'number',
    unit: 'kW',
    min: 1,
    max: 15,
    defaultValue: 3,
    labelFor: (v) => `전원 ${v}kW`,
  },
  {
    key: 'soundproof',
    title: '방음 등급 (최소)',
    kind: 'soundproof',
    defaultValue: '보통',
    labelFor: (v) => `방음 ${v} 이상`,
  },
  { key: 'rehearsalAllowed', title: '리허설 가능', kind: 'boolean', defaultValue: true, labelFor: () => '리허설 가능' },
]

const SOUNDPROOF_OPTIONS = [
  { value: '취약' as SoundproofGrade, label: '취약' },
  { value: '보통' as SoundproofGrade, label: '보통' },
  { value: '좋음' as SoundproofGrade, label: '좋음' },
]

/** ★ 필요 장비 체크리스트 — 켜면 needs 배열에 추가, 끄면 제거 */
export function NeedsChecklist({
  needs,
  onChange,
}: {
  needs: PerformerNeed[]
  onChange: (next: PerformerNeed[]) => void
}) {
  const find = (key: NeedKey) => needs.find((n) => n.key === key)

  const setValue = (def: Def, value: number | boolean | SoundproofGrade) => {
    const next = needs.filter((n) => n.key !== def.key)
    next.push({ key: def.key, value, label: def.labelFor(value) })
    onChange(next)
  }

  const toggle = (def: Def, on: boolean) => {
    if (!on) {
      onChange(needs.filter((n) => n.key !== def.key))
      return
    }
    setValue(def, def.defaultValue)
  }

  return (
    <div className="space-y-3">
      {DEFS.map((def) => {
        const current = find(def.key)
        const on = !!current
        return (
          <div key={def.key} className="rounded-xl border border-border p-3.5">
            <Toggle checked={on} onChange={(v) => toggle(def, v)} label={def.title} />
            {on && def.kind === 'number' && (
              <div className="mt-2.5">
                <Stepper
                  value={Number(current?.value ?? def.defaultValue)}
                  onChange={(v) => setValue(def, v)}
                  min={def.min}
                  max={def.max}
                  unit={def.unit}
                />
              </div>
            )}
            {on && def.kind === 'soundproof' && (
              <div className="mt-2.5">
                <Segmented
                  value={(current?.value as SoundproofGrade) ?? '보통'}
                  options={SOUNDPROOF_OPTIONS}
                  onChange={(v) => setValue(def, v)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
