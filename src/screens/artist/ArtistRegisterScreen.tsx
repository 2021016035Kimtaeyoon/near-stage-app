import { AlertCircle, ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody } from '@/components/shell/ScreenHeader'
import { GenreTag } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { MultiChoiceWithOther, SingleChoiceWithOther } from '@/components/ui/ChipsWithOther'
import { Gauge, Label, TextArea, TextInput } from '@/components/ui/Field'
import { useAuthStore } from '@/hooks/useAuth'
import { addClips } from '@/hooks/useClips'
import { describeDbError, supabase } from '@/lib/supabase'
import { toast } from '@/store/useToast'
import { GENRES } from '@/types'
import { PhotoUploader } from '../host/PhotoUploader'
import {
  ARTIST_LIMITS,
  NEED_OPTIONS,
  artistCompleteness,
  artistNumOrNull,
  artistStepErrors,
  artistRowToDraft,
  useArtistDraft,
} from './artistDraft'
import { ClipLinkEditor } from './ClipLinkEditor'
import { SetlistEditor } from './SetlistEditor'

const STEPS = ['팀 기본', '소개·셋리스트', '조건·사진·영상'] as const

/**
 * 아티스트 등록 (§8-2).
 *
 * 공간 등록과 같은 구조입니다. 필수는 팀명·장르·인원·공연 길이 넷뿐이고, 나머지는
 * 비워도 제출됩니다 — 완성도가 낮으면 조건에 맞는 공간이 덜 찾아올 뿐입니다.
 *
 * 공간과 달리 아티스트는 자동 승인하지 않습니다. 주소처럼 기계가 확인할 수 있는
 * 근거가 없어서, 지금은 운영자 확인을 거칩니다.
 */
export function ArtistRegisterScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  // 수정 모드 — /artist/:artistId/edit
  const { artistId } = useParams<{ artistId: string }>()
  const isEdit = !!artistId
  const { draft, patch, clear, load } = useArtistDraft(artistId)
  const [loaded, setLoaded] = useState(!isEdit)

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const percent = artistCompleteness(draft)

  // 수정 모드 첫 진입에 서버 값을 채웁니다. 고치던 초안이 있으면 그대로 씁니다.
  useEffect(() => {
    if (!isEdit || loaded) return
    let alive = true
    void supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        setLoaded(true)
        if (error || !data) {
          toast('팀을 불러오지 못했어요', 'error', error ? describeDbError(error) : undefined)
          return
        }
        if (draft.teamName.trim()) return
        load(artistRowToDraft(data))
      })
    return () => {
      alive = false
    }
  }, [isEdit, loaded, artistId, load, draft.teamName])

  const goNext = () => {
    const errs = artistStepErrors(draft, step)
    setErrors(errs)
    if (errs.length > 0) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      window.scrollTo({ top: 0 })
    }
  }

  const submit = () => {
    const all = [0, 1, 2].flatMap((s) => artistStepErrors(draft, s))
    setErrors(all)
    if (all.length > 0) {
      setStep(0)
      toast('빠진 항목이 있어요', 'warn', all[0])
      return
    }

    requireAuth(async () => {
      const uid = useAuthStore.getState().userId
      if (!uid) return
      setSubmitting(true)
      const payload = {
          owner_id: uid,
          team_name: draft.teamName.trim(),
          genre: draft.genre,
          member_count: artistNumOrNull(draft.memberCount, ARTIST_LIMITS.memberCount) ?? 1,
          duration_min: artistNumOrNull(draft.durationMin, ARTIST_LIMITS.durationMin) ?? 60,
          bio: draft.bio.trim(),
          setlist: draft.setlist,
          needs: draft.needs,
          photos: draft.photos,
          // 클립은 artist_clips 표가 원천입니다. 이 컬럼은 예전 데이터 호환용으로만
          // 링크를 남겨둡니다.
          clip_urls: draft.clipUrls.filter((c) => c.kind === 'link').map((c) => c.url),
      }

      const { data: created, error } = isEdit
        ? await supabase.from('artists').update(payload).eq('id', artistId).select('id').single()
        : await supabase.from('artists').insert(payload).select('id').single()

      if (error || !created) {
        setSubmitting(false)
        toast('등록에 실패했어요', 'error', describeDbError(error))
        return
      }

      // 클립은 팀이 만들어진 뒤에 넣습니다 — artist_id 가 있어야 하고, RLS 도
      // 팀 주인인지 확인합니다. 실패해도 팀 등록 자체는 되돌리지 않습니다.
      // 수정 모드에서는 클립을 다시 넣지 않습니다 — 클립 관리 화면이 원천입니다
      const clipErr = isEdit ? null : await addClips(created.id, draft.clipUrls)
      setSubmitting(false)
      if (clipErr) {
        toast('팀은 등록했지만 클립을 저장하지 못했어요', 'warn', clipErr)
      }
      clear()
      toast(
        isEdit ? '저장했어요' : '등록을 접수했어요',
        'success',
        isEdit ? '바뀐 내용이 반영됩니다' : '운영자 확인 후 공개됩니다',
      )
      navigate('/artist/me', { replace: true })
    })
  }

  const body = [
    <div key="0" className="space-y-5">
      <div>
        <Label hint="관객에게 보일 이름입니다">팀 이름</Label>
        <TextInput
          value={draft.teamName}
          onChange={(e) => patch({ teamName: e.target.value })}
          placeholder="예) 토요일의 목소리"
          maxLength={40}
        />
      </div>

      <div>
        <Label>장르</Label>
        <SingleChoiceWithOther
          options={GENRES}
          value={draft.genre}
          onChange={(genre) => patch({ genre })}
          placeholder="예) 판소리, 마임, 인형극"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>인원</Label>
          <TextInput
            type="number"
            inputMode="numeric"
            value={draft.memberCount}
            onChange={(e) => patch({ memberCount: e.target.value })}
            min={ARTIST_LIMITS.memberCount.min}
            max={ARTIST_LIMITS.memberCount.max}
          />
        </div>
        <div>
          <Label hint="쉬는 시간 빼고">공연 길이 (분)</Label>
          <TextInput
            type="number"
            inputMode="numeric"
            value={draft.durationMin}
            onChange={(e) => patch({ durationMin: e.target.value })}
            min={ARTIST_LIMITS.durationMin.min}
            max={ARTIST_LIMITS.durationMin.max}
          />
        </div>
      </div>
    </div>,

    <div key="1" className="space-y-5">
      <div>
        <Label hint="호스트가 이 글을 보고 수락을 결정합니다">팀 소개</Label>
        <TextArea
          rows={6}
          value={draft.bio}
          onChange={(e) => patch({ bio: e.target.value })}
          placeholder="어떤 공연을 하는지, 어떤 분위기인지, 어떤 공간과 잘 맞는지 적어주세요."
          maxLength={600}
        />
        <p className="tnum mt-1 text-right text-2xs text-ink-3">{draft.bio.length}/600</p>
      </div>

      <div>
        <Label hint="순서대로 무엇을 하는지 적어두면 호스트가 그림을 그립니다">셋리스트</Label>
        <SetlistEditor items={draft.setlist} onChange={(setlist) => patch({ setlist })} />
      </div>
    </div>,

    <div key="2" className="space-y-5">
      <div>
        <Label hint="공간이 등록한 장비와 항목별로 자동 대조합니다">공연에 필요한 것</Label>
        <MultiChoiceWithOther
          options={NEED_OPTIONS}
          values={draft.needs}
          onChange={(needs) => patch({ needs })}
          placeholder="쉼표로 여러 개 (예: 드럼 세트, 보면대 2개)"
        />
        <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
          꼭 필요한 것만 골라주세요. 많이 고를수록 조건이 맞는 공간이 줄어듭니다.
        </p>
      </div>

      <div>
        <Label>사진</Label>
        {userId ? (
          <PhotoUploader
            bucket="artist-photos"
            photos={draft.photos}
            onChange={(photos) => patch({ photos })}
            max={4}
          />
        ) : (
          <p className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
            사진은 로그인한 뒤에 올릴 수 있어요. 지금은 건너뛰고 제출할 때 로그인하셔도
            됩니다.
          </p>
        )}
      </div>

      <div>
        <Label hint="관객의 클립 탭에도 그대로 올라갑니다">클립 · 공연 영상</Label>
        <ClipLinkEditor
          clips={draft.clipUrls}
          onChange={(clipUrls) => patch({ clipUrls })}
          userId={userId}
        />
      </div>
    </div>,
  ][step]

  return (
    <Screen>
      <div className="border-b border-border px-4 pb-3 pt-12">
        <div className="flex items-center gap-2">
          <IconButton label="뒤로" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-bold">{isEdit ? '팀 정보 수정' : '공연팀 등록'}</h1>
            <p className="tnum mt-0.5 text-2xs text-ink-3">
              {step + 1} / {STEPS.length} · {STEPS[step]}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-gold-500' : 'bg-surface-2'}`}
            />
          ))}
        </div>
      </div>

      <ScreenBody>
        <div className="mb-4">
          <Gauge value={percent} caption={`프로필 완성도 ${percent}%`} />
          <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
            채운 항목 수로 계산합니다. 소개·셋리스트·영상이 있으면 호스트가 수락을 훨씬 빨리
            결정합니다.
          </p>
        </div>

        {draft.genre && !(GENRES as readonly string[]).includes(draft.genre) && (
          <p className="mb-4 text-2xs text-ink-3">
            직접 입력한 장르(<GenreTag genre={null} label={draft.genre} size="sm" />)는 그대로
            저장되고, 장르 필터에는 걸리지 않습니다.
          </p>
        )}

        {errors.length > 0 && (
          <div className="mb-4 rounded-xl border border-danger/35 bg-danger/10 p-3">
            {errors.map((e) => (
              <p key={e} className="flex items-start gap-1.5 text-xs font-semibold text-danger">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}

        {body}

        <div className="mt-6 flex gap-2 pb-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              이전
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="brand" full onClick={goNext}>
              다음
            </Button>
          ) : (
            <Button variant="brand" full loading={submitting} onClick={submit}>
              {isEdit ? '저장하기' : '등록하기'}
            </Button>
          )}
        </div>
      </ScreenBody>
    </Screen>
  )
}
