import { AlertCircle, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, ScreenBody } from '@/components/shell/ScreenHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { Gauge } from '@/components/ui/Field'
import { useAuthStore } from '@/hooks/useAuth'
import { describeDbError, supabase } from '@/lib/supabase'
import { toast } from '@/store/useToast'
import { PhotoUploader } from './PhotoUploader'
import { StepBasic, StepEquipment, StepPhotos, StepScale } from './VenueSteps'
import { LIMITS, completeness, numOrNull, stepErrors, useVenueDraft } from './venueDraft'

const STEPS = ['기본 정보', '규모·조건', '장비', '사진·소개'] as const

/**
 * 공간 등록 (§8-1).
 *
 * 4스텝으로 나눈 이유: 한 화면에 20개 항목을 펼쳐놓으면 사장님이 시작조차 하지
 * 않습니다. 각 스텝은 "지금 답할 수 있는 질문"만 묻고, 모르는 항목은 비울 수 있게
 * 했습니다. 필수는 이름·주소·좌표·수용인원 넷뿐입니다.
 *
 * 제출하면 status='pending' 으로 들어가고 운영자 승인 전에는 지도에 보이지 않습니다.
 */
export function VenueRegisterScreen() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const { draft, patch, clear } = useVenueDraft()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

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
      const { error } = await supabase.from('venues').insert({
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
        // status 는 기본값 'pending' 입니다. 여기서 보내지 않습니다 —
        // 보내도 트리거가 막지만, 애초에 클라이언트가 정할 값이 아닙니다.
      })
      setSubmitting(false)

      if (error) {
        toast('등록에 실패했어요', 'error', describeDbError(error))
        return
      }
      clear()
      toast('등록을 접수했어요', 'success', '운영자 확인 후 지도에 공개됩니다')
      navigate('/host/venue', { replace: true })
    })
  }

  const stepBody = [
    <StepBasic key="0" draft={draft} patch={patch} />,
    <StepScale key="1" draft={draft} patch={patch} />,
    <StepEquipment key="2" draft={draft} patch={patch} />,
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
            <h1 className="text-[16px] font-bold">우리 가게 등록</h1>
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
              등록 신청하기
            </Button>
          )}
        </div>
      </ScreenBody>
    </Screen>
  )
}
