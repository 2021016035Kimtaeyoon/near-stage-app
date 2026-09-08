import type { VenueShow } from '@/hooks/useVenueStats'

/**
 * 공연별 참석 예정 vs 실제 방문객 (§14).
 *
 * ★ 예전에는 "공연 있던 주 / 없던 주 평균 방문객"을 비교했습니다. 그럴싸했지만
 *   공연이 없던 날의 방문객 수를 우리가 알 방법이 없습니다. 알 수 없는 값을 그린
 *   그래프는 사장님이 그걸 근거로 결정을 내리게 만들기 때문에, 없는 것보다 나쁩니다.
 *
 * 그래서 실제로 아는 두 값만 나란히 둡니다 — 앱에서 오겠다고 누른 수, 그리고
 * 사장님이 적어준 실제 방문객.
 */
export function PerformanceChart({ shows }: { shows: VenueShow[] }) {
  // 방문객을 적은 공연만. 안 적은 공연을 0 으로 그리면 "손님이 없었다"로 읽힙니다
  const rows = shows.filter((s) => s.visitorCount !== null).slice(0, 8).reverse()

  if (rows.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-2xs leading-relaxed text-ink-2">
          공연이 끝난 뒤 <b>실제로 몇 분이 오셨는지</b> 적어주시면 여기에 쌓입니다. 두세 번만
          모여도 어느 요일·어느 장르가 우리 가게에 맞는지 보이기 시작합니다.
        </p>
      </div>
    )
  }

  const max = Math.max(...rows.map((r) => Math.max(r.goingCount, r.visitorCount ?? 0)), 1)

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-3 text-2xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-surface-2 ring-1 ring-border-strong" />
          참석 예정
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-gold-500 h-2.5 w-2.5 rounded-sm" />
          실제 방문
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const d = new Date(r.startsAt)
          const actual = r.visitorCount ?? 0
          return (
            <div key={r.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="tnum shrink-0 text-2xs font-bold text-ink-2">
                  {d.getMonth() + 1}.{d.getDate()}
                </span>
                <span className="min-w-0 flex-1 truncate text-2xs text-ink-3">{r.artistName}</span>
                <span className="tnum shrink-0 text-2xs font-bold">
                  {actual}명
                  {r.goingCount > 0 && (
                    <span className="ml-1 font-semibold text-ink-3">
                      (예정 {r.goingCount})
                    </span>
                  )}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-border-strong"
                    style={{ width: `${(r.goingCount / max) * 100}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="bg-gold-500 h-full rounded-full"
                    style={{ width: `${(actual / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-2xs leading-relaxed text-ink-3">
        참석 예정은 앱에서 누른 수라 실제와 다릅니다. 두 숫자의 차이가 큰 날이 있으면 그날
        무슨 일이 있었는지 메모에 적어두세요.
      </p>
    </div>
  )
}
