import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { runInvariantChecks, settleableCount } from './invariants'

/**
 * DEV 전용 데이터 무결성 대시보드. `import.meta.env.DEV`일 때만 App.tsx에서 마운트됩니다.
 * 실제 store를 대상으로 참조 무결성 · 파생값 규칙을 즉석에서 검증해, 화면 코드가
 * 하드코딩된 숫자가 아니라 store에서 계산한 값을 쓰고 있는지 확인하는 용도입니다.
 */
export function DevCheckScreen() {
  const navigate = useNavigate()
  const state = useAppStore()
  const resetAll = useAppStore((s) => s.resetAll)
  const results = runInvariantChecks(state)
  const failCount = results.filter((r) => !r.ok).length

  const counts = [
    ['공연 (Show)', state.shows.length],
    ['구인글 (Post)', state.posts.length],
    ['지원 (Application)', state.posts.reduce((n, p) => n + p.applications.length, 0)],
    ['예약 (Reservation)', state.reservations.length],
    ['정산 (Settlement)', state.settlements.length],
    ['리뷰 (Review)', state.reviews.length],
    ['알림 (Notification)', state.notifications.length],
    ['채팅 스레드', state.chatThreads.length],
  ] as const

  return (
    <div className="min-h-screen w-full bg-bg text-ink">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold">/devcheck — 데이터 무결성 점검</h1>
            <p className="mt-0.5 text-small text-ink-3">DEV 전용. 프로덕션 빌드에는 포함되지 않습니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => resetAll()}
              className="tap flex items-center gap-1.5 rounded-full border border-border-strong px-3 text-small font-semibold text-ink-2"
            >
              <RotateCcw size={14} /> 시드 리셋
            </button>
            <button
              onClick={() => navigate('/')}
              className="tap rounded-full border border-border-strong px-3 text-small font-semibold text-ink-2"
            >
              앱으로
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6">
        <section
          className={
            failCount === 0
              ? 'card-elevated flex items-center gap-3 border-ok/35 bg-ok/10 p-4'
              : 'card-elevated flex items-center gap-3 border-danger/35 bg-danger/10 p-4'
          }
        >
          {failCount === 0 ? (
            <CheckCircle2 className="text-ok" size={22} />
          ) : (
            <AlertTriangle className="text-danger" size={22} />
          )}
          <p className="text-body font-bold">
            {failCount === 0
              ? `전부 통과 — 규칙 ${results.length}건 정상`
              : `${failCount}건 위반 발견 (총 ${results.length}건 중)`}
          </p>
        </section>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {counts.map(([label, value]) => (
            <div key={label} className="card p-3 text-center">
              <p className="tnum text-h3 font-extrabold">{value}</p>
              <p className="mt-0.5 text-2xs text-ink-3">{label}</p>
            </div>
          ))}
        </div>

        {settleableCount(state) > 0 && (
          <p className="mt-3 text-center text-2xs text-warn">
            종료됐지만 아직 정산되지 않은 공연 {settleableCount(state)}건 — 공간주 화면의 「정산」 탭에서 처리하세요.
          </p>
        )}

        <div className="mt-6 space-y-2.5">
          {results.map((r) => (
            <div
              key={r.id}
              className={
                r.ok
                  ? 'card flex items-start gap-3 p-3.5'
                  : 'card flex items-start gap-3 border-danger/40 bg-danger/5 p-3.5'
              }
            >
              {r.ok ? (
                <CheckCircle2 className="mt-0.5 shrink-0 text-ok" size={18} />
              ) : (
                <AlertTriangle className="mt-0.5 shrink-0 text-danger" size={18} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold">{r.label}</p>
                <p className="mt-0.5 text-small text-ink-2">{r.description}</p>
                {!r.ok && (
                  <p className="tnum mt-1.5 text-2xs text-danger">
                    위반: {r.offenders.slice(0, 5).join(', ')}
                    {r.offenders.length > 5 ? ` 외 ${r.offenders.length - 5}건` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
