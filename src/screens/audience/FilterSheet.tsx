import { BellPlus, Check } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip, Toggle } from '@/components/ui/Chip'
import { GenreTag } from '@/components/ui/Badge'
import { sameSavedFilter, toSavedFilter } from '@/lib/savedSearch'
import { DEFAULT_FILTER } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { GENRES, type AudienceFilter, type Genre, type PriceFilter } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  filter: AudienceFilter
  onChange: (patch: Partial<AudienceFilter>) => void
  resultCount: number
}

const PRICE_OPTIONS: Array<{ value: PriceFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'free', label: '무료' },
  { value: 'under10k', label: '1만원 이하' },
]

export function FilterSheet({ open, onClose, filter, onChange, resultCount }: Props) {
  const savedSearches = useAppStore((s) => s.savedSearches)
  const saveCurrentSearch = useAppStore((s) => s.saveCurrentSearch)
  const applySavedSearch = useAppStore((s) => s.applySavedSearch)

  const current = toSavedFilter(filter)
  const matched = savedSearches.find((s) => sameSavedFilter(s.filter, current))

  const toggleGenre = (g: Genre) => {
    const next = filter.genres.includes(g)
      ? filter.genres.filter((x) => x !== g)
      : [...filter.genres, g]
    onChange({ genres: next })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="필터"
      subtitle="조건을 좁힐수록 오늘 밤 갈 곳이 분명해집니다"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onChange(DEFAULT_FILTER)}>
            초기화
          </Button>
          <Button variant="brand" full onClick={onClose}>
            공연 {resultCount}건 보기
          </Button>
        </div>
      }
    >
      {savedSearches.length > 0 && (
        <>
          <section className="pb-5">
            <h3 className="mb-2.5 text-sm font-bold">저장한 관심 조건</h3>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {savedSearches.map((s) => (
                <Chip
                  key={s.id}
                  active={matched?.id === s.id}
                  onClick={() => applySavedSearch(s.id)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          </section>
          <div className="divider" />
        </>
      )}

      <section className="py-5">
        <h3 className="mb-2.5 text-sm font-bold">장르</h3>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button key={g} onClick={() => toggleGenre(g)} className="tap">
              <span className={filter.genres.includes(g) ? 'opacity-100' : 'opacity-45'}>
                <GenreTag genre={g} />
              </span>
            </button>
          ))}
        </div>
        {filter.genres.length > 0 && (
          <button
            onClick={() => onChange({ genres: [] })}
            className="mt-2.5 text-xs font-semibold text-ink-3 underline underline-offset-2"
          >
            장르 선택 해제
          </button>
        )}
      </section>

      <div className="divider" />

      <section className="py-5">
        <h3 className="mb-2.5 text-sm font-bold">가격</h3>
        <div className="flex gap-1.5">
          {PRICE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={filter.price === o.value}
              onClick={() => onChange({ price: o.value })}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="py-4">
        <Toggle
          checked={filter.ownOnly}
          onChange={(v) => onChange({ ownOnly: v })}
          label="우리 무대만 보기"
          hint="등록 공연장 공연을 빼고, 우리가 직접 만든 동네 무대만 봅니다"
        />
      </section>

      <div className="divider" />

      <section className="py-4">
        <Button
          variant={matched ? 'solid' : 'outline'}
          full
          disabled={!!matched}
          leading={matched ? <Check size={16} /> : <BellPlus size={16} />}
          onClick={() => saveCurrentSearch()}
        >
          {matched ? `저장됨 · ${matched.name}` : '이 조건 저장하고 알림 받기'}
        </Button>
        <p className="mt-2 text-2xs leading-relaxed text-ink-3">
          조건에 맞는 공연이 새로 열리면 알림으로 알려드려요. 저장한 조건은 마이 페이지에서
          관리할 수 있습니다.
        </p>
      </section>
    </BottomSheet>
  )
}
