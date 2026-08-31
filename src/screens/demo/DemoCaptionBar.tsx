import { Pause, Play, RotateCcw, SkipBack, SkipForward, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { DEMO_STEPS } from './demoSteps'

const SPEEDS = [0.5, 1, 2]

/**
 * 시연 중 항상 화면 맨 위에 떠 있는 자막 + 컨트롤 바.
 * 어떤 실제 화면(홈/대시보드/상세 등) 위에 있어도 겹쳐서 보입니다.
 */
export function DemoCaptionBar() {
  const active = useAppStore((s) => s.demo.active)
  const stepIndex = useAppStore((s) => s.demo.stepIndex)
  const playing = useAppStore((s) => s.demo.playing)
  const speed = useAppStore((s) => s.demo.speed)
  const setDemo = useAppStore((s) => s.setDemo)
  const resetDemoScenario = useAppStore((s) => s.resetDemoScenario)

  if (!active) return null

  const step = DEMO_STEPS[stepIndex]
  const isLast = stepIndex >= DEMO_STEPS.length - 1

  return (
    <div className="absolute inset-x-0 top-0 z-[110] border-b border-border-strong bg-[#17171C] px-4 pb-2.5 pt-11 text-white shadow-lg">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="tnum bg-gold-500 rounded-full px-2 py-0.5 text-2xs font-extrabold">
          {stepIndex + 1} / {DEMO_STEPS.length}
        </span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-2xs font-bold">
          [{step.role}] {step.title}
        </span>
        <button
          onClick={() => setDemo({ active: false, playing: false })}
          aria-label="시연 종료"
          className="tap -mr-2 flex items-center justify-center text-white/70"
        >
          <X size={18} />
        </button>
      </div>

      <p className="text-[13px] font-semibold leading-snug">{step.caption}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconBtn label="처음부터" onClick={resetDemoScenario}>
            <RotateCcw size={15} />
          </IconBtn>
          <IconBtn
            label="이전 단계"
            onClick={() => setDemo({ stepIndex: Math.max(0, stepIndex - 1), playing: false })}
            disabled={stepIndex === 0}
          >
            <SkipBack size={15} />
          </IconBtn>
          <IconBtn
            label={playing ? '일시정지' : '재생'}
            onClick={() => setDemo({ playing: !playing })}
            primary
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </IconBtn>
          <IconBtn
            label="다음 단계"
            onClick={() => setDemo({ stepIndex: Math.min(DEMO_STEPS.length - 1, stepIndex + 1), playing: false })}
            disabled={isLast}
          >
            <SkipForward size={15} />
          </IconBtn>
        </div>

        <div className="flex gap-0.5 rounded-full bg-white/10 p-0.5">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              onClick={() => setDemo({ speed: sp })}
              className={
                speed === sp
                  ? 'rounded-full bg-white px-2 py-1 text-2xs font-bold text-[#17171C]'
                  : 'rounded-full px-2 py-1 text-2xs font-bold text-white/70'
              }
            >
              {sp}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled = false,
  primary = false,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        primary
          ? 'bg-gold-500 tap flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30'
          : 'tap flex h-9 w-9 items-center justify-center rounded-full bg-white/10 disabled:opacity-30'
      }
    >
      {children}
    </button>
  )
}
