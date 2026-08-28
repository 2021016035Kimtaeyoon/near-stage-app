import { useState } from 'react'
import { Label, TextArea, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { GENRES, type Genre, type Venue } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/** 공간 기본 정보 편집 폼 */
export function VenueInfoForm({ venue }: { venue: Venue }) {
  const updateVenue = useAppStore((s) => s.updateVenue)
  const [name, setName] = useState(venue.name)
  const [address, setAddress] = useState(venue.address)
  const [capacity, setCapacity] = useState(String(venue.capacity))
  const [rentalFee, setRentalFee] = useState(String(venue.rentalFee))
  const [ownerNote, setOwnerNote] = useState(venue.ownerNote)
  const [genres, setGenres] = useState<Genre[]>(venue.preferredGenres)

  const toggleGenre = (g: Genre) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const save = () => {
    updateVenue(venue.id, {
      name: name.trim() || venue.name,
      address: address.trim() || venue.address,
      capacity: Math.max(1, Number(capacity) || venue.capacity),
      rentalFee: Math.max(0, Number(rentalFee) || 0),
      ownerNote,
      preferredGenres: genres,
    })
    toast('공간 정보가 저장되었습니다', 'success')
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>공간 이름</Label>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>주소</Label>
        <TextInput value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>수용 인원</Label>
          <TextInput
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div>
          <Label hint="0원이면 수익배분">대여료</Label>
          <TextInput
            inputMode="numeric"
            value={rentalFee}
            onChange={(e) => setRentalFee(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>
      <div>
        <Label>선호 장르</Label>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={
                genres.includes(g)
                  ? 'brand-gradient rounded-full px-3 py-1.5 text-xs font-bold text-white'
                  : 'rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2'
              }
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label hint="공연자에게 그대로 보여집니다">사장님 한마디</Label>
        <TextArea rows={3} value={ownerNote} onChange={(e) => setOwnerNote(e.target.value)} />
      </div>
      <Button full variant="brand" onClick={save}>
        정보 저장하기
      </Button>
    </div>
  )
}
