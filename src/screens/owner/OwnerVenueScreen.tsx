import { Zap } from 'lucide-react'
import { useState } from 'react'
import { Screen, ScreenBody, ScreenHeader, SectionTitle } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAppStore } from '@/store/useAppStore'
import type { Weekday } from '@/types'
import { AddSlotSheet } from './AddSlotSheet'
import { EquipmentForm } from './EquipmentForm'
import { UrgentMatchModal } from './UrgentMatchModal'
import { VenueInfoForm } from './VenueInfoForm'
import { WeeklySlotGrid } from './WeeklySlotGrid'

type Tab = 'info' | 'equipment' | 'schedule'

export function OwnerVenueScreen() {
  const venueId = useAppStore((s) => s.currentVenueId)
  const venue = useAppStore((s) => s.venues.find((v) => v.id === venueId))
  const [tab, setTab] = useState<Tab>('info')
  const [addSlotOpen, setAddSlotOpen] = useState(false)
  const [urgentOpen, setUrgentOpen] = useState(false)
  const [pendingCell, setPendingCell] = useState<{ weekday: Weekday; startMin: number; endMin: number }>({
    weekday: 3,
    startMin: 20 * 60,
    endMin: 22 * 60,
  })

  if (!venue) {
    return (
      <Screen>
        <ScreenHeader title="내 공간 관리" />
        <EmptyState art="stage" title="공간 정보를 찾을 수 없어요" />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="내 공간 관리" subtitle={venue.name} />
      <ScreenBody>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'info', label: '정보' },
            { value: 'equipment', label: '장비·조건' },
            { value: 'schedule', label: '가능 시간' },
          ]}
        />

        <div className="mt-4">
          {tab === 'info' && <VenueInfoForm venue={venue} />}
          {tab === 'equipment' && <EquipmentForm venue={venue} />}
          {tab === 'schedule' && (
            <div>
              <Button
                full
                variant="brand"
                leading={<Zap size={16} />}
                className="mb-4"
                onClick={() => setUrgentOpen(true)}
              >
                오늘 저녁 비었어요 · 긴급 매칭
              </Button>

              <SectionTitle>주간 가능 시간</SectionTitle>
              <WeeklySlotGrid
                venueId={venue.id}
                slots={venue.availableSlots}
                onEmptyCellTap={(weekday, band) => {
                  setPendingCell({ weekday, startMin: band.startMin, endMin: Math.min(band.endMin, band.startMin + 120) })
                  setAddSlotOpen(true)
                }}
              />

              <Button
                full
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setPendingCell({ weekday: 3, startMin: 20 * 60, endMin: 22 * 60 })
                  setAddSlotOpen(true)
                }}
              >
                + 정기 슬롯 직접 등록
              </Button>
            </div>
          )}
        </div>

        <TabBarSpacer />
      </ScreenBody>

      <AddSlotSheet
        open={addSlotOpen}
        onClose={() => setAddSlotOpen(false)}
        venueId={venue.id}
        defaultWeekday={pendingCell.weekday}
        defaultStartMin={pendingCell.startMin}
        defaultEndMin={pendingCell.endMin}
      />
      <UrgentMatchModal open={urgentOpen} onClose={() => setUrgentOpen(false)} venue={venue} />
    </Screen>
  )
}
