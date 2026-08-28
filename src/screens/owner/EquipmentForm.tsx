import { Gauge, Label, RangeSlider, Stepper } from '@/components/ui/Field'
import { Segmented, Toggle } from '@/components/ui/Chip'
import { PhotoSlots } from './PhotoSlots'
import { venueCompleteness } from '@/lib/match'
import { useAppStore } from '@/store/useAppStore'
import type { SoundproofGrade, Venue } from '@/types'

const SOUNDPROOF_OPTIONS: Array<{ value: SoundproofGrade; label: string }> = [
  { value: '취약', label: '취약' },
  { value: '보통', label: '보통' },
  { value: '좋음', label: '좋음' },
]

/**
 * ★ 장비/조건 규격화 폼 — 실제 매칭 실패를 막는 핵심 화면.
 * 완성도 % 게이지로 입력을 유도합니다.
 */
export function EquipmentForm({ venue }: { venue: Venue }) {
  const updateVenueEquipment = useAppStore((s) => s.updateVenueEquipment)
  const eq = venue.equipment
  const completeness = venueCompleteness(venue)

  return (
    <div className="space-y-5">
      <Gauge
        value={completeness}
        caption="완성도 높은 공간이 3배 더 매칭됩니다. 규격을 정확히 입력할수록 지원자와의 조건 충돌이 줄어들어요."
      />

      <PhotoSlots
        seed={venue.photoSeed}
        genre={venue.preferredGenres[0] ?? '밴드'}
        filled={venue.photoSlotsFilled}
        onAdd={() =>
          useAppStore
            .getState()
            .updateVenue(venue.id, { photoSlotsFilled: Math.min(4, venue.photoSlotsFilled + 1) })
        }
      />

      <div>
        <Label hint="공연자가 요구하는 최소 조건과 비교됩니다">무대 가로</Label>
        <RangeSlider
          value={eq.stageWidthM}
          onChange={(v) => updateVenueEquipment(venue.id, { stageWidthM: v })}
          min={1}
          max={8}
          step={0.5}
          unit="m"
        />
      </div>

      <div>
        <Label>천장 높이</Label>
        <RangeSlider
          value={eq.ceilingHeightM}
          onChange={(v) => updateVenueEquipment(venue.id, { ceilingHeightM: v })}
          min={2}
          max={6}
          step={0.1}
          unit="m"
        />
      </div>

      <div>
        <Label>사용 가능 전원 용량</Label>
        <RangeSlider
          value={eq.powerKw}
          onChange={(v) => updateVenueEquipment(venue.id, { powerKw: v })}
          min={1}
          max={20}
          step={1}
          unit="kW"
        />
      </div>

      <div className="rounded-xl border border-border p-3.5">
        <Toggle
          checked={eq.sound}
          onChange={(v) => updateVenueEquipment(venue.id, { sound: v })}
          label="음향 시스템"
          hint="스피커·앰프 등 기본 음향 장비 보유 여부"
        />
      </div>

      <div>
        <Label>마이크 개수</Label>
        <Stepper
          value={eq.mic}
          onChange={(v) => updateVenueEquipment(venue.id, { mic: v })}
          min={0}
          max={8}
          unit="개"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-3.5">
          <Toggle
            checked={eq.piano}
            onChange={(v) => updateVenueEquipment(venue.id, { piano: v })}
            label="피아노"
          />
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <Toggle
            checked={eq.projector}
            onChange={(v) => updateVenueEquipment(venue.id, { projector: v })}
            label="프로젝터"
          />
        </div>
      </div>

      <div>
        <Label>방음 등급</Label>
        <Segmented
          value={eq.soundproof}
          options={SOUNDPROOF_OPTIONS}
          onChange={(v) => updateVenueEquipment(venue.id, { soundproof: v })}
        />
      </div>

      <div className="rounded-xl border border-border p-3.5">
        <Toggle
          checked={eq.rehearsalAllowed}
          onChange={(v) => updateVenueEquipment(venue.id, { rehearsalAllowed: v })}
          label="리허설 가능"
          hint="공연 전 리허설을 위한 사전 방문을 허용합니다"
        />
      </div>
    </div>
  )
}
