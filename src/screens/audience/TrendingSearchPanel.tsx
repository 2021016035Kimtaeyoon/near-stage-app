import { Flame, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TrendingKeyword } from '@/lib/trending'

/**
 * 검색창 포커스 시 뜨는 실시간 인기 검색어 패널.
 * 별도 서버 없이 현재 좋아요·팔로워·예약 수치로 즉석에서 랭킹을 계산합니다.
 */
export function TrendingSearchPanel({
  keywords,
  onSelect,
}: {
  keywords: TrendingKeyword[]
  onSelect: (term: string) => void
}) {
  if (keywords.length === 0) return null

  return (
    <div className="mx-4 mt-1.5 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <TrendingUp size={13} className="text-[#F0B429]" />
        <span className="text-xs font-bold">실시간 인기 검색어</span>
      </div>
      <ul>
        {keywords.map((k) => (
          <li key={k.term}>
            <button
              onClick={() => onSelect(k.term)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left active:bg-surface-2"
            >
              <span
                className={cn(
                  'tnum w-4 shrink-0 text-sm font-extrabold',
                  k.hot ? 'text-[#F0B429]' : 'text-ink-3',
                )}
              >
                {k.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                {k.term}
              </span>
              {k.hot && <Flame size={12} className="shrink-0 text-[#F0B429]" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
