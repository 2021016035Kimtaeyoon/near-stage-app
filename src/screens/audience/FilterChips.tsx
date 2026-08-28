import { ChevronDown, Sparkles } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import type { AudienceFilter, DistanceFilter, WhenFilter } from '@/types'

interface Props {
  filter: AudienceFilter
  onChange: (patch: Partial<AudienceFilter>) => void
  onOpenSheet: () => void
}

const WHEN_OPTIONS: Array<{ value: WhenFilter; label: string }> = [
  { value: 'tonight', label: '오늘 밤' },
  { value: 'weekend', label: '주말' },
  { value: 'all', label: '전체 기간' },
]

const DISTANCE_OPTIONS: Array<{ value: DistanceFilter; label: string }> = [
  { value: 1, label: '1km' },
  { value: 2, label: '2km' },
  { value: 5, label: '5km' },
  { value: 0, label: '거리 전체' },
]

const PRICE_LABEL: Record<AudienceFilter['price'], string> = {
  all: '가격 전체',
  free: '무료',
  under10k: '1만원 이하',
}

export function FilterChips({ filter, onChange, onOpenSheet }: Props) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-1">
      {WHEN_OPTIONS.map((o) => (
        <Chip
          key={o.value}
          active={filter.when === o.value}
          onClick={() => onChange({ when: o.value })}
        >
          {o.label}
        </Chip>
      ))}

      <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden />

      {DISTANCE_OPTIONS.map((o) => (
        <Chip
          key={o.label}
          active={filter.distance === o.value}
          onClick={() => onChange({ distance: o.value })}
        >
          {o.label}
        </Chip>
      ))}

      <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden />

      <Chip active={filter.genres.length > 0} onClick={onOpenSheet}>
        {filter.genres.length === 0
          ? '장르 전체'
          : filter.genres.length === 1
            ? filter.genres[0]
            : `장르 ${filter.genres.length}개`}
        <ChevronDown size={13} />
      </Chip>

      <Chip active={filter.price !== 'all'} onClick={onOpenSheet}>
        {PRICE_LABEL[filter.price]}
        <ChevronDown size={13} />
      </Chip>

      <Chip brand active={filter.ownOnly} onClick={() => onChange({ ownOnly: !filter.ownOnly })}>
        <Sparkles size={12} />
        우리 무대만
      </Chip>
    </div>
  )
}
