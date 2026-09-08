import { CalendarPlus, Lock, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMyVenues } from '@/hooks/useMyResources'
import { deleteSlot, setSlotOpen, useSlots, type Slot } from '@/hooks/useSlots'
import { WEEKDAY_LABELS } from '@/lib/datetime'
import { toast } from '@/store/useToast'
import { SlotSheet } from './SlotSheet'

/**
 * 가능 시간 관리 (§10).
 *
 * 구인글을 올려도 "언제 비는지"가 없으면 아티스트가 지원할 수 없습니다. 그래서
 * 슬롯이 매칭의 출발점입니다.
 *
 * 지난 시간은 아예 가져오지 않습니다 — 지나간 날짜를 닫으라고 시키는 화면은
 * 할 일 목록만 늘립니다.
 */
export function VenueSlotsScreen() {
  const navigate = useNavigate()
  const { venueId } = useParams<{ venueId: string }>()
  const venues = useMyVenues()
  const slots = useSlots(venueId ?? null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const venue = venues.data.find((v) => v.id === venueId)

  if (!venues.loading && !venue) {
    return (
      <Screen>
        <ScreenHeader title="가능 시간" back />
        <ScreenBody>
          <EmptyState
            art="search"
            title="공간을 찾을 수 없어요"
            description="내 공간 목록에서 다시 선택해주세요."
            action={
              <Button variant="outline" onClick={() => navigate('/host/venue')}>
                내 공간으로
              </Button>
            }
          />
        </ScreenBody>
      </Screen>
    )
  }

  // 날짜별로 묶습니다. 시간만 죽 늘어놓으면 "이번 주 뭐가 열려 있지"가 안 보입니다
  const byDate = new Map<string, Slot[]>()
  for (const s of slots.data) {
    const key = new Date(s.startsAt).toLocaleDateString('ko-KR')
    const list = byDate.get(key)
    if (list) list.push(s)
    else byDate.set(key, [s])
  }

  const openCount = slots.data.filter((s) => s.isOpen && !s.lockedByShowId).length
  const bookedCount = slots.data.filter((s) => s.lockedByShowId).length

  return (
    <Screen>
      <ScreenHeader
        title="가능 시간"
        subtitle={venue?.name}
        back
        right={
          <Button
            size="sm"
            variant="brand"
            leading={<CalendarPlus size={14} />}
            onClick={() => setSheetOpen(true)}
          >
            추가
          </Button>
        }
      />
      <ScreenBody>
        <p className="mb-4 rounded-xl bg-surface-2 p-3 text-2xs leading-relaxed text-ink-2">
          열어둔 시간에만 공연팀이 지원할 수 있습니다. 지금 열린 시간 <b>{openCount}개</b>
          {bookedCount > 0 && <> · 공연 확정 {bookedCount}개</>}
        </p>

        {slots.loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : slots.error ? (
          <EmptyState
            art="search"
            title="불러오지 못했어요"
            description={slots.error}
            action={
              <Button variant="outline" onClick={slots.refresh}>
                다시 시도
              </Button>
            }
          />
        ) : slots.data.length === 0 ? (
          <EmptyState
            art="stage"
            title="열어둔 시간이 없어요"
            description="가게가 한가한 시간을 하나만 열어보세요. 평일 저녁 두 시간이면 충분합니다."
            action={
              <Button variant="brand" leading={<CalendarPlus size={16} />} onClick={() => setSheetOpen(true)}>
                가능 시간 추가
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {[...byDate.entries()].map(([date, list]) => {
              const d = new Date(list[0].startsAt)
              return (
                <div key={date}>
                  <p className="mb-1.5 text-2xs font-bold text-ink-3">
                    {d.getMonth() + 1}월 {d.getDate()}일 ({WEEKDAY_LABELS[d.getDay()]})
                  </p>
                  <div className="space-y-1.5">
                    {list.map((s) => (
                      <SlotRow key={s.id} slot={s} onDone={slots.refresh} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <TabBarSpacer />
      </ScreenBody>

      {venueId && (
        <SlotSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          venueId={venueId}
          existing={slots.data}
          onDone={slots.refresh}
        />
      )}
    </Screen>
  )
}

function hm(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function SlotRow({ slot, onDone }: { slot: Slot; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const locked = !!slot.lockedByShowId

  const toggle = async () => {
    if (locked) {
      toast('공연이 확정된 시간이에요', 'warn', '공연을 취소해야 이 시간을 닫을 수 있습니다')
      return
    }
    setBusy(true)
    const err = await setSlotOpen(slot.id, !slot.isOpen)
    setBusy(false)
    if (err) {
      toast('바꾸지 못했어요', 'error', err)
      return
    }
    onDone()
  }

  const remove = async () => {
    if (locked) {
      toast('공연이 확정된 시간은 지울 수 없어요', 'warn')
      return
    }
    setBusy(true)
    const err = await deleteSlot(slot.id)
    setBusy(false)
    if (err) {
      toast('지우지 못했어요', 'error', err)
      return
    }
    toast('시간을 지웠어요')
    onDone()
  }

  return (
    <div className="card flex items-center gap-2 px-3.5 py-2.5">
      <span className="tnum text-sm font-bold">
        {hm(slot.startsAt)} – {hm(slot.endsAt)}
      </span>
      {locked ? (
        <Tag tone="ok">
          <span className="inline-flex items-center gap-1">
            <Lock size={9} />
            공연 확정
          </span>
        </Tag>
      ) : slot.isOpen ? (
        <Tag tone="warn">열림</Tag>
      ) : (
        <Tag>닫힘</Tag>
      )}

      <span className="flex-1" />

      {!locked && (
        <>
          <Button size="sm" variant="outline" loading={busy} onClick={() => void toggle()}>
            {slot.isOpen ? '닫기' : '열기'}
          </Button>
          <button
            onClick={() => void remove()}
            aria-label="시간 지우기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 active:bg-surface-2"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  )
}
