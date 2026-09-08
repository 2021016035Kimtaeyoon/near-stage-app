import { ArrowRight, Music4, Store } from 'lucide-react'
import { useAppNavigate } from '@/lib/appLink'
import { cn } from '@/lib/cn'

/**
 * CTA 3종 — 랜딩의 섹션마다 반복 배치합니다.
 *
 * 방문자를 3초 안에 다음 행동으로 보내는 것이 랜딩의 유일한 목표라, 스크롤 어디에서
 * 멈춰도 손 닿는 곳에 같은 버튼 세 개가 있어야 합니다.
 */
export function LandingCtaRow({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  // 화면 크기에 맞는 경로로 보냅니다 — 폰에서 /desktop 으로 가면 안내 화면에 막힙니다
  const go = useAppNavigate()
  const outline =
    tone === 'dark'
      ? 'border-white/25 text-white'
      : 'border-border-strong text-ink'

  return (
    <div className={cn('mx-auto flex w-full max-w-md flex-col gap-2.5', className)}>
      <button
        onClick={() => go('/')}
        className="bg-gold-500 flex h-[54px] items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-gold-ink"
      >
        공연 보러가기
        <ArrowRight size={17} />
      </button>
      <div className="flex gap-2.5">
        <button
          onClick={() => go('/host/venue/new')}
          className={cn(
            'flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-2xl border text-[14px] font-bold',
            outline,
          )}
        >
          <Store size={16} />
          우리 가게 등록하기
        </button>
        <button
          onClick={() => go('/artist/new')}
          className={cn(
            'flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-2xl border text-[14px] font-bold',
            outline,
          )}
        >
          <Music4 size={16} />
          공연팀 등록하기
        </button>
      </div>
    </div>
  )
}
