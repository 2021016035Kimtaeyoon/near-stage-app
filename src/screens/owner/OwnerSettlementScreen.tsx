import { FileCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader, SectionTitle } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiCard, KpiGrid } from '@/components/ui/Kpi'
import { humanDate, won } from '@/lib/datetime'
import { getShowStatus } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

export function OwnerSettlementScreen() {
  const venueId = useAppStore((s) => s.currentVenueId)
  const shows = useAppStore((s) => s.shows)
  const settlements = useAppStore((s) => s.settlements)
  const settleAll = useAppStore((s) => s.settleAll)
  const nowIso = useAppStore((s) => s.demoNowIso)
  const [issued, setIssued] = useState<Set<string>>(new Set())

  const myShowIds = new Set(shows.filter((s) => s.venueId === venueId).map((s) => s.id))
  const showStart = (showId: string) => shows.find((s) => s.id === showId)?.startAt ?? ''
  const mine = settlements
    .filter((st) => myShowIds.has(st.showId))
    .sort((a, b) => showStart(b.showId).localeCompare(showStart(a.showId)))

  const pending = mine.filter((st) => st.status === '정산대기')
  const pendingTotal = pending.reduce((n, st) => n + st.net, 0)
  const doneTotal = mine
    .filter((st) => st.status === '정산완료')
    .reduce((n, st) => n + st.net, 0)
  // 공연이 끝나야 실제로 정산할 수 있습니다 — 대기 중이어도 진행 전 공연은 제외
  const settleable = pending.filter((st) => {
    const show = shows.find((s) => s.id === st.showId)
    return show && getShowStatus(show, nowIso) === '종료'
  })

  return (
    <Screen>
      <ScreenHeader title="정산" subtitle="공연별 정산 내역과 수수료 명세" />
      <ScreenBody>
        <KpiGrid>
          <KpiCard icon={Wallet} label="정산 예정액" value={`${won(pendingTotal)}원`} tone="brand" hint={`${pending.length}건 대기중`} />
          <KpiCard icon={FileCheck} label="누적 정산 완료액" value={`${won(doneTotal)}원`} />
        </KpiGrid>

        {settleable.length > 0 && (
          <Button
            full
            variant="brand"
            className="mt-4"
            onClick={() => {
              const total = settleAll(venueId)
              toast('정산이 완료되었습니다', 'success', `${won(total)}원이 정산 처리되었어요`)
            }}
          >
            종료된 공연 정산 {settleable.length}건 한 번에 처리하기
          </Button>
        )}

        <div className="mt-5">
          <SectionTitle>정산 내역</SectionTitle>
          {mine.length === 0 ? (
            <EmptyState art="chart" title="정산 내역이 없어요" description="공연이 확정되면 정산 내역이 자동으로 생성됩니다." />
          ) : (
            <div className="space-y-2.5">
              {mine.map((st) => {
                const show = shows.find((s) => s.id === st.showId)
                const alreadyIssued = issued.has(st.id)
                const notYetEnded = st.status === '정산대기' && show && getShowStatus(show, nowIso) !== '종료'
                return (
                  <div key={st.id} className="card p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold">{show?.title ?? '공연'}</p>
                      <Tag tone={st.status === '정산완료' ? 'ok' : 'warn'}>
                        {notYetEnded ? '공연 예정' : st.status}
                      </Tag>
                    </div>
                    {show && (
                      <p className="tnum mt-0.5 text-2xs text-ink-3">
                        {humanDate(show.startAt, nowIso)} · 예약 {show.reservedCount}명
                        {notYetEnded && ' · 공연 종료 후 정산 가능'}
                      </p>
                    )}
                    <div className="tnum mt-2.5 space-y-1 text-xs">
                      <Row label="총 매출 (티켓가 × 예약 인원)" value={`${won(st.gross)}원`} />
                      <Row label="플랫폼 수수료" value={`-${won(st.platformFee)}원`} />
                      <div className="divider my-1" />
                      <Row label="정산액" value={`${won(st.net)}원`} bold />
                    </div>
                    <Button
                      full
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      disabled={alreadyIssued}
                      onClick={() => {
                        setIssued((prev) => new Set(prev).add(st.id))
                        toast('세금계산서가 발행되었습니다', 'success', '등록된 이메일로 전송됩니다')
                      }}
                    >
                      {alreadyIssued ? '세금계산서 발행 완료' : '세금계산서 발행'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-2">{label}</span>
      <span className={bold ? 'font-extrabold' : 'font-semibold'}>{value}</span>
    </div>
  )
}
