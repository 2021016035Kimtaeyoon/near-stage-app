import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FREE_TRIAL_NOTICE } from '@/config/brand'

/**
 * 시범 운영 무료 안내.
 *
 * 돈 이야기가 나올 법한 자리(공연 상세, 참석 예정, 지원 수락, 대시보드)마다 붙여서
 * "결제 단계가 어디선가 나오겠지"라는 기대를 아예 만들지 않습니다.
 * §16의 푸터가 들어오면 전 화면 하단에도 같은 문구가 함께 노출됩니다.
 */
export function FreeTrialNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-2xs font-semibold text-ink-2',
        className,
      )}
    >
      <Sparkles size={12} className="shrink-0 text-gold-text" />
      {FREE_TRIAL_NOTICE}
    </p>
  )
}
