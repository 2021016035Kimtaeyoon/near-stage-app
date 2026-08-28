import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { EmptyState } from '@/components/ui/EmptyState'

/** 아직 구현 전인 화면용 임시 컴포넌트 (단계가 진행되며 실제 화면으로 교체됩니다) */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <Screen>
      <ScreenHeader title={title} back />
      <ScreenBody>
        <EmptyState art="stage" title={title} description={note ?? '다음 단계에서 구현됩니다.'} />
        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}
