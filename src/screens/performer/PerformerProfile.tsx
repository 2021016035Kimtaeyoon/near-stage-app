import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button } from '@/components/ui/Button'
import { GenreTag } from '@/components/ui/Badge'
import { Gauge, Label, Stepper, TextArea, TextInput } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { PhotoSlots } from '@/screens/owner/PhotoSlots'
import { GENRES, type Genre } from '@/types'
import { performerCompleteness } from '@/lib/match'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import { NeedsChecklist } from './NeedsChecklist'
import { SetlistEditor } from './SetlistEditor'

export function PerformerProfile() {
  const performerId = useAppStore((s) => s.currentPerformerId)
  const performer = useAppStore((s) => s.performers.find((p) => p.id === performerId))
  const updatePerformer = useAppStore((s) => s.updatePerformer)

  const [teamName, setTeamName] = useState(performer?.teamName ?? '')
  const [genre, setGenre] = useState<Genre>(performer?.genre ?? '밴드')
  const [memberCount, setMemberCount] = useState(performer?.memberCount ?? 1)
  const [durationMin, setDurationMin] = useState(performer?.durationMin ?? 30)
  const [bio, setBio] = useState(performer?.bio ?? '')

  if (!performer) {
    return (
      <Screen>
        <ScreenHeader title="프로필" />
        <EmptyState art="stage" title="프로필을 찾을 수 없어요" />
      </Screen>
    )
  }

  const completeness = performerCompleteness(performer)

  const saveBasics = () => {
    updatePerformer(performer.id, { teamName, genre, memberCount, durationMin, bio })
    toast('프로필이 저장되었습니다', 'success')
  }

  return (
    <Screen>
      <ScreenHeader title="프로필 / 포트폴리오" subtitle={performer.teamName} />
      <ScreenBody>
        <Gauge value={completeness} caption="완성도가 높을수록 구인글 매칭·역경매 제안이 늘어납니다." />

        <div className="mt-4">
          <PhotoSlots
            seed={performer.photoSeed}
            genre={performer.genre}
            filled={performer.clipCount > 4 ? 4 : performer.clipCount}
            onAdd={() => {
              updatePerformer(performer.id, { clipCount: performer.clipCount + 1 })
              toast('클립을 추가했습니다', 'success')
            }}
          />
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label>팀명</Label>
            <TextInput value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>

          <div>
            <Label>장르</Label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button key={g} onClick={() => setGenre(g)} className="tap">
                  <span className={genre === g ? 'opacity-100' : 'opacity-40'}>
                    <GenreTag genre={g} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>인원</Label>
              <Stepper value={memberCount} onChange={setMemberCount} min={1} max={12} unit="인" />
            </div>
            <div>
              <Label>공연 길이</Label>
              <Stepper value={durationMin} onChange={setDurationMin} min={10} max={150} unit="분" />
            </div>
          </div>

          <div>
            <Label>소개</Label>
            <TextArea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <Button full variant="brand" onClick={saveBasics}>
            프로필 저장하기
          </Button>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <SetlistEditor
            setlist={performer.setlist}
            onChange={(setlist) => updatePerformer(performer.id, { setlist })}
          />
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <h2 className="mb-3 text-[15px] font-bold">필요 장비 체크리스트</h2>
          <NeedsChecklist
            needs={performer.needs}
            onChange={(needs) => updatePerformer(performer.id, { needs })}
          />
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
