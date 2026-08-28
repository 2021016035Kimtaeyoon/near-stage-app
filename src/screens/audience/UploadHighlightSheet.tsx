import { Camera, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Label, TextInput } from '@/components/ui/Field'
import { PosterArt } from '@/components/ui/PosterArt'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'
import type { Performer } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  performers: Performer[]
  defaultPerformerId: string
  onUploaded: (performerId: string, title: string) => void
}

/**
 * 공연 하이라이트 업로드 폼.
 * 실제 영상 촬영·업로드 기능은 없으므로, 지금은 결정론적 그라데이션 "사진"으로
 * 대체합니다 — 버튼을 눌러 다른 사진 느낌으로 바꿔볼 수 있습니다.
 */
export function UploadHighlightSheet({
  open,
  onClose,
  performers,
  defaultPerformerId,
  onUploaded,
}: Props) {
  const updatePerformer = useAppStore((s) => s.updatePerformer)
  const [performerId, setPerformerId] = useState(defaultPerformerId)
  const [title, setTitle] = useState('')
  const [photoTake, setPhotoTake] = useState(0)

  const performer = performers.find((p) => p.id === performerId) ?? performers[0]
  const previewSeed = useMemo(
    () => `${performer?.id ?? 'x'}-upload-preview-${photoTake}`,
    [performer?.id, photoTake],
  )

  const submit = () => {
    if (!performer) return
    const clipTitle = title.trim() || `${performer.teamName} 공연 하이라이트`
    updatePerformer(performer.id, {
      clipTitles: [clipTitle, ...performer.clipTitles],
      clipCount: performer.clipCount + 1,
    })
    toast('공연 하이라이트가 올라갔어요', 'success', '클립 피드 맨 위에서 바로 볼 수 있어요')
    onUploaded(performer.id, clipTitle)
    setTitle('')
    setPhotoTake(0)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="공연 하이라이트 올리기"
      subtitle="지금은 영상 대신 사진 한 장으로 대체됩니다"
      footer={
        <Button full variant="brand" leading={<Camera size={16} />} onClick={submit}>
          하이라이트 올리기
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label hint="실제 영상 업로드는 준비 중이에요">사진 미리보기</Label>
          <div className="relative h-44 w-full overflow-hidden rounded-2xl">
            {performer && (
              <PosterArt
                seed={previewSeed}
                genre={performer.genre}
                className="h-full w-full"
                deep
                glyphScale={1.4}
              />
            )}
            <button
              onClick={() => setPhotoTake((n) => n + 1)}
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-2xs font-bold text-white"
            >
              <RefreshCw size={12} />
              다른 사진으로
            </button>
          </div>
        </div>

        <div>
          <Label>어떤 팀의 공연인가요?</Label>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {performers.map((p) => (
              <button
                key={p.id}
                onClick={() => setPerformerId(p.id)}
                className={
                  p.id === performerId
                    ? 'brand-gradient shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white'
                    : 'shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2'
                }
              >
                {p.teamName}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label hint="비워두면 팀명으로 자동 채워져요">하이라이트 제목</Label>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 오늘 공연 앵콜 무대"
          />
        </div>
      </div>
    </BottomSheet>
  )
}
