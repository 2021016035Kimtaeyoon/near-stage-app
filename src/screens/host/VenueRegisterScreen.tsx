import { AlertCircle, ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody } from '@/components/shell/ScreenHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { Gauge } from '@/components/ui/Field'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, supabase } from '@/lib/supabase'
import { toast } from '@/store/useToast'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { PhotoUploader } from './PhotoUploader'
import { StepBasic, StepEquipment, StepPhotos, StepScale } from './VenueSteps'
import {
  LIMITS,
  completeness,
  numOrNull,
  stepErrors,
  useVenueDraft,
  venueRowToDraft,
} from './venueDraft'

const STEPS = ['기본 정보', '규모·조건', '장비', '사진·소개'] as const

/**
 * 공간 등록 (§8-1).
 *
 * 4스텝으로 나눈 이유: 한 화면에 20개 항목을 펼쳐놓으면 사장님이 시작조차 하지
 * 않습니다. 각 스텝은 "지금 답할 수 있는 질문"만 묻고, 모르는 항목은 비울 수 있게
 * 했습니다. 필수는 이름·주소·좌표·수용인원 넷뿐입니다.
 *
 * 제출하면 DB 트리거가 주소·필수 항목을 확인해 즉시 공개할지 심사 대기로 둘지
 * 판정합니다(0009_venue_auto_approve.sql). 클라이언트는 status 를 정하지 않습니다.
 */
export function VenueRegisterScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  // 수정 모드 — /host/venue/:venueId/edit
  const { venueId } = useParams<{ venueId: string }>()
  const isEdit = !!venueId
  const { draft, patch, clear, load } = useVenueDraft(venueId)
  const [loaded, setLoaded] = useState(!isEdit)

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  /**
   * 치수를 재는 데 쓴 사진을 공간 사진으로도 올립니다.
   * 이미 찍은 사진이니 한 번 더 고르게 하지 않습니다.
   */
  const useMeasurePhoto = (f: File) => {
    const uid = useAuthStore.getState().userId
    if (!uid) return
    void uploadPhoto('venue-photos', uid, f)
      .then(({ url }) => {
        patch({ photos: [...draft.photos, url] })
        toast('사진도 함께 등록했어요', 'success')
      })
      .catch((e: unknown) => {
        toast('사진을 올리지 못했어요', 'error', e instanceof Error ? e.message : undefined)
      })
  }

  const percent = completeness(draft)

  const goNext = () => {
    const errs = stepErrors(draft, step)
    setErrors(errs)
    if (errs.length > 0) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      window.scrollTo({ top: 0 })
    }
  }

  // 수정 모드 첫 진입에 서버 값을 폼에 채웁니다. 이미 채워둔 초안이 있으면
  // 그대로 씁니다 — 고치다 창을 닫은 내용을 서버 값으로 덮으면 안 됩니다.
  useEffect(() => {
    if (!isEdit || loaded) return
    let alive = true
    void supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        setLoaded(true)
        if (error || !data) {
          toast('공간을 불러오지 못했어요', 'error', error ? describeDbError(error) : undefined)
          return
        }
        if (draft.name.trim()) return // 고치던 내용이 있으면 유지
        load(venueRowToDraft(data))
      })
    return () => {
      alive = false
    }
  }, [isEdit, loaded, venueId, load, draft.name])

  const submit = () => {
    // 모든 스텝의 필수 조건을 마지막에 한 번 더 확인합니다
    const all = [0, 1, 2].flatMap((s) => stepErrors(draft, s))
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
          name: draft.name.trim(),
          category: draft.category,
          address: [draft.address, draft.addressDetail].filter(Boolean).join(' ').trim(),
          lat: draft.lat,
          lng: draft.lng,
          capacity: numOrNull(draft.capacity, LIMITS.capacity),
          rental_fee: Math.max(0, Number(draft.rentalFee) || 0),
          preferred_genres: draft.preferredGenres,
          description: draft.description.trim(),
          photos: draft.photos,
          equipment: {
            sound: draft.sound,
            mic: numOrNull(draft.mic, LIMITS.mic) ?? 0,
            piano: draft.piano,
            projector: draft.projector,
            stageWidthM: numOrNull(draft.stageWidthM, LIMITS.stageWidthM),
            ceilingHeightM: numOrNull(draft.ceilingHeightM, LIMITS.ceilingHeightM),
            powerKw: numOrNull(draft.powerKw, LIMITS.powerKw),
            soundproof: draft.soundproof,
            rehearsalAllowed: draft.rehearsalAllowed,
          },
          // status 는 보내지 않습니다. DB 트리거가 조건을 보고 즉시 공개할지
          // 심사 대기로 둘지 판정합니다(0009_venue_auto_approve.sql).
          // 클라이언트가 정할 값이 아닙니다.
      }

      const { data, error } = isEdit
        ? await supabase.from('venues').update(payload).eq('id', venueId).select('status').single()
        : await supabase.from('venues').insert(payload).select('status').single()
      setSubmitting(false)

      if (error) {
        toast('등록에 실패했어요', 'error', describeDbError(error))
        return
      }
      clear()
      // 판정 결과를 읽어와 안내합니다 — 추측해서 말하면 화면과 실제가 어긋납니다
      if (isEdit) {
        toast('저장했어요', 'success', data?.status === 'approved' ? '바뀐 내용이 바로 반영됩니다' : '확인이 필요해 심사 대기로 들어갔어요')
      } else if (data?.status === 'approved') {
        toast('등록됐어요', 'success', '지금부터 지도에 공개됩니다')
      } else {
        toast('등록을 접수했어요', 'success', '확인이 필요해 잠시 심사 대기로 들어갔어요')
      }
      navigate('/host/venue', { replace: true })
    })
  }

  const stepBody = [
    <StepBasic key="0" draft={draft} patch={patch} />,
    <StepScale key="1" draft={draft} patch={patch} />,
    <StepEquipment key="2" draft={draft} patch={patch} onMeasurePhoto={useMeasurePhoto} />,
    <StepPhotos
      key="3"
      draft={draft}
      patch={patch}
      photoSlot={
        userId ? (
          <PhotoUploader
            bucket="venue-photos"
            photos={draft.photos}
            onChange={(photos) => patch({ photos })}
          />
        ) : (
          <p className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
            사진은 로그인한 뒤에 올릴 수 있어요. 지금은 건너뛰고 제출할 때 로그인하셔도
            됩니다.
          </p>
        )
      }
    />,
  ][step]

  return (
    <Screen>
      <div className="border-b border-border px-4 pb-3 pt-12">
        <div className="flex items-center gap-2">
          <IconButton
            label="뒤로"
            onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          >
            <ChevronLeft size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-bold">{isEdit ? '공간 정보 수정' : '우리 가게 등록'}</h1>
            <p className="tnum mt-0.5 text-2xs text-ink-3">
              {step + 1} / {STEPS.length} · {STEPS[step]}
            </p>
          </div>
        </div>

        {/* 진행 표시 */}
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
            채운 항목 수로 계산합니다. 많이 채울수록 조건이 맞는 팀이 정확히 찾아옵니다.
          </p>
        </div>

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

        {stepBody}

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
