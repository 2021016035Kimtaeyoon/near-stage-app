import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { createDemoCtx, DEMO_STEPS, type DemoCtx } from './demoSteps'

/**
 * 자동 시연 엔진 — 라우터 트리 안에 항상 마운트되어 있다가
 * demo.active가 켜지면 8단계를 순서대로 실행합니다(실제 store 액션 + 실제 라우팅).
 * 화면에는 아무것도 그리지 않습니다(로직 전용). 자막/컨트롤은 DemoCaptionBar가 담당합니다.
 */
export function DemoEngine() {
  const navigate = useNavigate()
  const active = useAppStore((s) => s.demo.active)
  const stepIndex = useAppStore((s) => s.demo.stepIndex)
  const playing = useAppStore((s) => s.demo.playing)
  const speed = useAppStore((s) => s.demo.speed)
  const runId = useAppStore((s) => s.demo.runId)
  const setDemo = useAppStore((s) => s.setDemo)

  const ctxRef = useRef<DemoCtx>(createDemoCtx())
  const executedRef = useRef<Set<number>>(new Set())
  const timerRef = useRef<number | null>(null)

  // "처음부터" 실행마다 진행 컨텍스트를 리셋합니다
  useEffect(() => {
    ctxRef.current = createDemoCtx()
    executedRef.current = new Set()
  }, [runId])

  // 현재 단계에 처음 진입했을 때만 실제 액션을 실행하고 그 결과 경로로 이동합니다
  useEffect(() => {
    if (!active) return
    const step = DEMO_STEPS[stepIndex]
    if (!step) return
    if (!executedRef.current.has(stepIndex)) {
      step.run(ctxRef.current)
      executedRef.current.add(stepIndex)
    }
    navigate(step.path(ctxRef.current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex])

  // 재생 중일 때 다음 단계로 자동 진행
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (!active || !playing) return
    const isLast = stepIndex >= DEMO_STEPS.length - 1
    if (isLast) {
      setDemo({ playing: false })
      return
    }
    const intervalMs = 2500 / speed
    timerRef.current = window.setTimeout(() => {
      setDemo({ stepIndex: stepIndex + 1 })
    }, intervalMs)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [active, playing, speed, stepIndex, setDemo])

  return null
}
