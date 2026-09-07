import { MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { GenreTag } from '@/components/ui/Badge'
import { Chip, Toggle } from '@/components/ui/Chip'
import { Label, Stepper, TextArea, TextInput } from '@/components/ui/Field'
import { DEFAULT_MAP_CENTER } from '@/config/brand'
import { geocodeAddress, openAddressSearch } from '@/lib/kakaoAddress'
import { toast } from '@/store/useToast'
import {
  GENRES,
  VENUE_CATEGORIES,
  type Genre,
  type SoundproofGrade,
  type VenueCategory,
} from '@/types'
import { PinPicker } from './PinPicker'
import { LIMITS, type VenueDraft } from './venueDraft'

type Patch = (p: Partial<VenueDraft>) => void

/* ─────────────── ① 기본정보 ─────────────── */

export function StepBasic({ draft, patch }: { draft: VenueDraft; patch: Patch }) {
  const [searching, setSearching] = useState(false)

  const search = async () => {
    setSearching(true)
    try {
      const picked = await openAddressSearch()
      if (!picked) return
      const coords = await geocodeAddress(picked.address)
      patch({
        address: picked.address,
        district: picked.bname || picked.sigungu,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      if (!coords) {
        toast('좌표를 자동으로 못 찾았어요', 'warn', '지도에서 위치를 직접 찍어주세요')
      }
    } catch (e) {
      toast('주소 검색을 열지 못했어요', 'error', e instanceof Error ? e.message : undefined)
    } finally {
      setSearching(false)
    }
  }

  // 좌표가 없으면 지도 기본 중심에서 시작해 직접 찍게 합니다
  const lat = draft.lat ?? DEFAULT_MAP_CENTER.lat
  const lng = draft.lng ?? DEFAULT_MAP_CENTER.lng

  return (
    <div className="space-y-5">
      <div>
        <Label hint="간판에 적힌 이름 그대로">공간 이름</Label>
        <TextInput
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="예) 연남동 작은 카페"
          maxLength={40}
        />
      </div>

      <div>
        <Label>어떤 공간인가요</Label>
        <div className="flex flex-wrap gap-1.5">
          {VENUE_CATEGORIES.map((c: VenueCategory) => (
            <Chip key={c} active={draft.category === c} onClick={() => patch({ category: c })}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>주소</Label>
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="flex h-11 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-left text-sm disabled:opacity-60"
        >
          <Search size={15} className="shrink-0 text-ink-3" />
          <span className={draft.address ? 'truncate text-ink' : 'text-ink-3'}>
            {searching ? '주소 검색을 여는 중…' : draft.address || '주소 검색하기'}
          </span>
        </button>
        {draft.address && (
          <div className="mt-2">
            <TextInput
              value={draft.addressDetail}
              onChange={(e) => patch({ addressDetail: e.target.value })}
              placeholder="상세 주소 (2층, 지하 1층 등)"
              maxLength={60}
            />
          </div>
        )}
      </div>

      <div>
        <Label hint="관객이 찾아올 지점입니다. 핀을 눌러 옮기거나 지도를 눌러 찍어주세요">
          지도에서 위치 확정
        </Label>
        <PinPicker
          lat={lat}
          lng={lng}
          onMove={(la, ln) => patch({ lat: la, lng: ln })}
          className="h-[220px] w-full overflow-hidden rounded-2xl border border-border"
        />
        <p className="tnum mt-2 flex items-center gap-1 text-2xs text-ink-3">
          <MapPin size={11} className="shrink-0" />
          {draft.lat !== null && draft.lng !== null
            ? `${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`
            : '아직 위치가 확정되지 않았어요'}
        </p>
      </div>
    </div>
  )
}

/* ─────────────── ② 규모·조건 ─────────────── */

export function StepScale({ draft, patch }: { draft: VenueDraft; patch: Patch }) {
  const toggleGenre = (g: Genre) =>
    patch({
      preferredGenres: draft.preferredGenres.includes(g)
        ? draft.preferredGenres.filter((x) => x !== g)
        : [...draft.preferredGenres, g],
    })

  return (
    <div className="space-y-5">
      <div>
        <Label hint="공연을 볼 손님이 앉거나 설 수 있는 최대 인원">수용 인원</Label>
        <TextInput
          type="number"
          inputMode="numeric"
          value={draft.capacity}
          onChange={(e) => patch({ capacity: e.target.value })}
          placeholder="예) 30"
          min={LIMITS.capacity.min}
          max={LIMITS.capacity.max}
        />
      </div>

      <div>
        <Label hint="공간을 빌려주는 값입니다. 받지 않으시면 0을 넣어주세요">대여료 (원)</Label>
        <TextInput
          type="number"
          inputMode="numeric"
          value={draft.rentalFee}
          onChange={(e) => patch({ rentalFee: e.target.value })}
          placeholder="0"
          min={0}
        />
        <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
          아티스트에게 줄 개런티와는 다릅니다. 개런티는 서로 이야기해서 정하시고, 플랫폼은
          어느 쪽 대금에도 관여하지 않습니다.
        </p>
      </div>

      <div>
        <Label hint="고르지 않아도 됩니다. 고르면 그 장르 팀에게 먼저 보입니다">
          이런 공연을 받고 싶어요
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button key={g} type="button" onClick={() => toggleGenre(g)} className="tap">
              <span className={draft.preferredGenres.includes(g) ? 'opacity-100' : 'opacity-45'}>
                <GenreTag genre={g} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── ③ 장비 ─────────────── */

const SOUNDPROOF: SoundproofGrade[] = ['좋음', '보통', '취약']

export function StepEquipment({ draft, patch }: { draft: VenueDraft; patch: Patch }) {
  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
        아티스트가 등록한 필요 조건과 여기 적은 장비를 항목별로 대조합니다. 정확히 적어두면
        조건이 안 맞는 팀이 지원해서 서로 시간 버리는 일이 없습니다.{' '}
        <b className="text-ink">모르는 항목은 비워두셔도 됩니다.</b>
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>무대 가로 (m)</Label>
          <TextInput
            type="number"
            inputMode="decimal"
            step="0.1"
            value={draft.stageWidthM}
            onChange={(e) => patch({ stageWidthM: e.target.value })}
            placeholder="예) 3"
          />
        </div>
        <div>
          <Label>천장 높이 (m)</Label>
          <TextInput
            type="number"
            inputMode="decimal"
            step="0.1"
            value={draft.ceilingHeightM}
            onChange={(e) => patch({ ceilingHeightM: e.target.value })}
            placeholder={`${LIMITS.ceilingHeightM.min}~${LIMITS.ceilingHeightM.max}`}
          />
        </div>
      </div>

      <div>
        <Label hint="분전반에 적혀 있거나, 한 번에 쓸 수 있는 전력량입니다">
          사용 가능 전원 (kW)
        </Label>
        <TextInput
          type="number"
          inputMode="decimal"
          step="0.5"
          value={draft.powerKw}
          onChange={(e) => patch({ powerKw: e.target.value })}
          placeholder={`${LIMITS.powerKw.min}~${LIMITS.powerKw.max}`}
        />
      </div>

      <div className="space-y-1">
        <Toggle
          checked={draft.sound}
          onChange={(v) => patch({ sound: v })}
          label="음향 시스템이 있어요"
          hint="스피커·믹서 등 소리를 낼 장비"
        />
        <Toggle checked={draft.piano} onChange={(v) => patch({ piano: v })} label="피아노가 있어요" />
        <Toggle
          checked={draft.projector}
          onChange={(v) => patch({ projector: v })}
          label="프로젝터가 있어요"
        />
        <Toggle
          checked={draft.rehearsalAllowed}
          onChange={(v) => patch({ rehearsalAllowed: v })}
          label="공연 전 리허설이 가능해요"
          hint="한두 시간 미리 들어와 소리를 맞출 수 있는지"
        />
      </div>

      <div>
        <Label>마이크 개수</Label>
        <Stepper
          value={Number(draft.mic) || 0}
          onChange={(v) => patch({ mic: String(v) })}
          min={LIMITS.mic.min}
          max={LIMITS.mic.max}
          unit="개"
        />
      </div>

      <div>
        <Label hint="옆집이나 위층에 소리가 얼마나 새는지">방음</Label>
        <div className="flex gap-1.5">
          {SOUNDPROOF.map((s) => (
            <Chip key={s} active={draft.soundproof === s} onClick={() => patch({ soundproof: s })}>
              {s}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── ④ 사진·소개 ─────────────── */

export function StepPhotos({
  draft,
  patch,
  photoSlot,
}: {
  draft: VenueDraft
  patch: Patch
  /** 사진 업로더 — 폼 컴포넌트가 넘겨줍니다 */
  photoSlot: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label hint="공연이 열릴 자리가 보이는 사진이 가장 도움이 됩니다">사진</Label>
        {photoSlot}
      </div>

      <div>
        <Label hint="아티스트가 이 글을 보고 지원합니다">공간 소개</Label>
        <TextArea
          rows={6}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="어떤 분위기인지, 주로 어떤 손님이 오는지, 공연하기 좋은 시간대가 언제인지 적어주세요."
          maxLength={600}
        />
        <p className="tnum mt-1 text-right text-2xs text-ink-3">{draft.description.length}/600</p>
      </div>
    </div>
  )
}
