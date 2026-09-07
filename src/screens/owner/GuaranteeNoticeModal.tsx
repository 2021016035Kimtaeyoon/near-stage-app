import { HandCoins } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { FEE_DISCLAIMER, SERVICE_NAME } from '@/config/brand'
import type { Performer, Post } from '@/types'

/**
 * 개런티 협의 안내.
 *
 * 예전에는 표준 계약서를 미리 보여줬지만, 이 서비스는 대금 거래의 당사자가 아닙니다.
 * 계약서 양식 대신 "두 분이 직접 정하시는 것"이라는 사실과, 정할 때 빠뜨리기 쉬운
 * 항목만 짚어줍니다.
 */
const CHECKLIST: Array<{ title: string; body: string }> = [
  {
    title: '금액과 지급 방식',
    body: '고정 개런티인지, 입장료 배분인지, 배분이면 비율이 몇 대 몇인지. 현금·계좌이체 중 무엇으로 언제 드릴지까지 정해두세요.',
  },
  {
    title: '공연 시간과 리허설',
    body: '몇 시부터 몇 분간인지, 리허설이 필요하면 몇 시에 들어올 수 있는지.',
  },
  {
    title: '준비물 분담',
    body: '음향·마이크·조명 중 공간이 대는 것과 팀이 가져오는 것을 나눠 적어두세요.',
  },
  {
    title: '취소 기준',
    body: '며칠 전까지 취소할 수 있는지, 당일 취소나 노쇼일 때 어떻게 할지.',
  },
]

export function GuaranteeNoticeModal({
  open,
  onClose,
  post,
  performer,
}: {
  open: boolean
  onClose: () => void
  post: Post
  performer: Performer
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="개런티 협의 안내"
      subtitle={`${performer.teamName}과(와) 직접 정하실 내용입니다`}
      footer={
        <Button full variant="brand" onClick={onClose}>
          확인했어요
        </Button>
      }
    >
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3.5 text-xs leading-relaxed text-ink-2">
        <HandCoins size={15} className="mt-0.5 shrink-0 text-gold-text" />
        <p>
          {FEE_DISCLAIMER} {SERVICE_NAME}은(는) 연결까지만 맡습니다.
        </p>
      </div>

      {post.offerFee > 0 && (
        <p className="mb-4 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
          구인글에 적어두신 참고 금액은{' '}
          <b className="tnum text-ink">{post.offerFee.toLocaleString('ko-KR')}원</b>입니다. 실제
          지급 금액은 대화에서 다시 확정해 주세요.
        </p>
      )}

      <h3 className="mb-2.5 text-sm font-bold">정하고 넘어가면 좋은 것</h3>
      <ul className="space-y-2.5">
        {CHECKLIST.map((c) => (
          <li key={c.title} className="rounded-xl border border-border p-3.5">
            <p className="text-[13px] font-bold">{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">{c.body}</p>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}
