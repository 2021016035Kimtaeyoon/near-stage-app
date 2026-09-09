import { BellPlus, Check } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { sameGenres, useSavedSearches } from '@/hooks/useSavedSearches'
import { toast } from '@/store/useToast'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip, Toggle } from '@/components/ui/Chip'
import { GenreTag } from '@/components/ui/Badge'
import { DEFAULT_FILTER } from '@/store/selectors'
import { GENRES, type AudienceFilter, type Genre } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  filter: AudienceFilter
  onChange: (patch: Partial<AudienceFilter>) => void
  resultCount: number
}

export function FilterSheet({ open, onClose, filter, onChange, resultCount }: Props) {
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const saved = useSavedSearches()
  // ★ 조건은 장르만입니다. 거리는 서버가 대조할 수 없습니다 — 브라우저 좌표를
  //   서버로 보내지 않기 때문입니다. 예전에는 연남동 고정 좌표로 재고 있었습니다.
  const matched = saved.data.find((s) => sameGenres(s.genres, filter.genres))
  const [saving, setSaving] = useState(false)

  const saveGenres = () =>
    requireAuth(() =>
      void (async () => {
        setSaving(true)
        const err = await saved.save(filter.genres)
        setSaving(false)
        if (err) toast('저장하지 못했어요', 'warn', err)
        else
          toast(
            '관심 장르를 저장했어요',
            'success',
            '이 장르의 무대가 새로 열리면 알려드려요',
          )
      })(),
    )

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
      {saved.data.length > 0 && (
        <>
          <section className="pb-5">
            <h3 className="mb-2.5 text-sm font-bold">저장한 관심 장르</h3>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {saved.data.map((s) => (
                <Chip
                  key={s.id}
                  active={matched?.id === s.id}
                  onClick={() => onChange({ genres: s.genres })}
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
          loading={saving}
          leading={matched ? <Check size={16} /> : <BellPlus size={16} />}
          onClick={saveGenres}
        >
          {matched
            ? `저장됨 · ${matched.name}`
            : filter.genres.length === 0
              ? '모든 장르 저장하고 알림 받기'
              : `${filter.genres.join('·')} 저장하고 알림 받기`}
        </Button>
        {/* ★ 무엇을 알려주는지 정확히 적습니다. 예전에는 '조건에 맞는 공연'이라고만
            해서, 거리·기간까지 대조하는 줄 읽히게 해놓고 실제로는 아무 알림도
            보내지 않았습니다. */}
        <p className="mt-2 text-2xs leading-relaxed text-ink-3">
          고른 장르로 <b>우리 무대가 새로 확정되면</b> 알림을 보내드려요. 등록 공연은
          하루에 수십 건이라 알림을 걸지 않습니다. 거리는 위치를 저장하지 않아 조건에
          넣지 못합니다.
        </p>
      </section>
    </BottomSheet>
  )
}
