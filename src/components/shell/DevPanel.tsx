import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, Clock, Code2, PlayCircle, RotateCcw, Settings2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_NOW_ISO, STORAGE_KEY } from '@/config/brand'
import { fmt, kstIso } from '@/lib/datetime'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/** 슬라이더 기준: 2026-09-05 06:00 부터 30분 단위 24시간 */
const BASE = kstIso(2026, 9, 5, 6, 0)
const STEP_MIN = 30
const STEPS = 48

function isoAtStep(step: number): string {
  const d = new Date(BASE)
  d.setMinutes(d.getMinutes() + step * STEP_MIN)
  return d.toISOString()
}

function stepFromIso(iso: string): number {
  const diff = (new Date(iso).getTime() - new Date(BASE).getTime()) / 60000 / STEP_MIN
  return Math.max(0, Math.min(STEPS, Math.round(diff)))
}

/** 시연자/개발자 패널 — 우상단 작은 버튼 */
export function DevPanel() {
  const [open, setOpen] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const demoNowIso = useAppStore((s) => s.demoNowIso)
  const setDemoNow = useAppStore((s) => s.setDemoNow)
  const resetAll = useAppStore((s) => s.resetAll)
  const pushNotification = useAppStore((s) => s.pushNotification)
  const role = useAppStore((s) => s.role)
  const demoActive = useAppStore((s) => s.demo.active)
  const navigate = useNavigate()

  const step = stepFromIso(demoNowIso)

  const json = useMemo(() => {
    if (!showJson) return ''
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return '(저장된 데이터 없음)'
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }, [showJson])

  if (demoActive) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="시연자 패널 열기"
        className="absolute right-3 top-3 z-[75] flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/85 text-ink-3 backdrop-blur active:text-ink"
      >
        <Settings2 size={15} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="absolute inset-0 z-[95]">
            <motion.button
              aria-label="닫기"
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute inset-x-3 top-3 flex max-h-[86%] flex-col overflow-hidden rounded-3xl border border-border bg-surface"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 42 }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Settings2 size={16} className="text-ink-2" />
                  <span className="text-sm font-bold">시연자 패널</span>
                </div>
                <button onClick={() => setOpen(false)} aria-label="닫기" className="tap text-ink-3">
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <section>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink-2">
                    <Clock size={13} /> 앱의 “지금” 시각
                  </div>
                  <div className="card p-3.5">
                    <div className="tnum mb-2 text-lg font-bold">
                      {fmt(demoNowIso, 'M월 d일(EEE) HH:mm')}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={STEPS}
                      step={1}
                      value={step}
                      onChange={(e) => setDemoNow(isoAtStep(Number(e.target.value)))}
                      aria-label="기준 시각 변경"
                      className="h-9 w-full cursor-pointer appearance-none bg-transparent
                        [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
                        [&::-webkit-slider-runnable-track]:bg-border
                        [&::-webkit-slider-thumb]:mt-[-9px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:bg-[#FFC42E]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-2xs text-ink-3">시간대별 지도 변화 시연용</span>
                      <button
                        onClick={() => setDemoNow(DEMO_NOW_ISO)}
                        className="text-2xs font-bold text-ink-2 underline underline-offset-2"
                      >
                        기본값으로
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <Button
                    full
                    variant="outline"
                    leading={<BellRing size={15} />}
                    onClick={() => {
                      pushNotification({
                        role,
                        type: '시스템',
                        title: '테스트 알림',
                        body: '시연자 패널에서 발생시킨 가짜 알림입니다.',
                        link: '/notifications',
                      })
                      toast('가짜 알림을 발생시켰습니다', 'success')
                    }}
                  >
                    가짜 알림 발생
                  </Button>
                  <Button
                    full
                    variant="outline"
                    leading={<PlayCircle size={15} />}
                    onClick={() => {
                      setOpen(false)
                      navigate('/demo')
                    }}
                  >
                    자동 시연 시나리오 열기
                  </Button>
                  <Button
                    full
                    variant="outline"
                    leading={<Code2 size={15} />}
                    onClick={() => setShowJson((v) => !v)}
                  >
                    {showJson ? 'localStorage 닫기' : 'localStorage 상태 보기'}
                  </Button>
                  <Button
                    full
                    variant="danger"
                    leading={<RotateCcw size={15} />}
                    onClick={() => {
                      resetAll()
                      setShowJson(false)
                      toast('데이터를 초기 상태로 되돌렸습니다', 'success')
                    }}
                  >
                    데이터 전체 리셋
                  </Button>
                </section>

                {showJson && (
                  <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-surface-2 p-3 text-[10px] leading-relaxed text-ink-2">
                    {json}
                  </pre>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
