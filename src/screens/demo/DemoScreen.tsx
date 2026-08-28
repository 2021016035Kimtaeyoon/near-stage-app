import { CheckCircle2, CirclePlay, Pause, Play, RotateCcw } from 'lucide-react'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { SERVICE_NAME } from '@/config/brand'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import { DEMO_STEPS } from './demoSteps'

export function DemoScreen() {
  const active = useAppStore((s) => s.demo.active)
  const stepIndex = useAppStore((s) => s.demo.stepIndex)
  const playing = useAppStore((s) => s.demo.playing)
  const setDemo = useAppStore((s) => s.setDemo)
  const resetDemoScenario = useAppStore((s) => s.resetDemoScenario)

  return (
    <Screen>
      <ScreenHeader title="자동 시연 시나리오" subtitle={`${SERVICE_NAME} 심사용 8단계 데모`} />
      <ScreenBody>
        {!active && (
          <div className="mb-5 rounded-2xl border border-border-strong bg-surface-2 p-4">
            <p className="text-[13px] leading-relaxed text-ink-2">
              재생 버튼 하나로 공간주가 구인글을 올리는 순간부터, 관객이 예약하고 리뷰를 남기기까지
              전체 흐름이 실제 화면 전환과 함께 자동으로 진행됩니다.
            </p>
            <Button
              full
              variant="brand"
              size="lg"
              leading={<CirclePlay size={18} />}
              className="mt-4"
              onClick={resetDemoScenario}
            >
              처음부터 재생하기
            </Button>
          </div>
        )}

        {active && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-border-strong bg-surface-2 p-3.5">
            <Button
              size="sm"
              variant="brand"
              leading={playing ? <Pause size={14} /> : <Play size={14} />}
              onClick={() => setDemo({ playing: !playing })}
            >
              {playing ? '일시정지' : '재생'}
            </Button>
            <Button size="sm" variant="outline" leading={<RotateCcw size={14} />} onClick={resetDemoScenario}>
              처음부터
            </Button>
            <span className="tnum ml-auto text-xs font-bold text-ink-2">
              {stepIndex + 1} / {DEMO_STEPS.length} 진행 중
            </span>
          </div>
        )}

        <div className="space-y-2">
          {DEMO_STEPS.map((step, i) => {
            const done = active && i < stepIndex
            const current = active && i === stepIndex
            return (
              <div
                key={step.title}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3',
                  current
                    ? 'border-transparent bg-gradient-to-br from-[#FF6B4A]/10 to-[#FF3D77]/10 ring-1 ring-[#FF5560]'
                    : 'border-border bg-surface',
                )}
              >
                <span
                  className={cn(
                    'tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                    done
                      ? 'bg-ok/15 text-ok'
                      : current
                        ? 'brand-gradient text-white'
                        : 'bg-surface-2 text-ink-3',
                  )}
                >
                  {done ? <CheckCircle2 size={14} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-2xs font-bold text-ink-2">
                      {step.role}
                    </span>
                    <p className="text-sm font-bold">{step.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-2">{step.caption}</p>
                </div>
              </div>
            )
          })}
        </div>
      </ScreenBody>
    </Screen>
  )
}
