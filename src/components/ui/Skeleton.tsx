import { cn } from '@/lib/cn'

interface Props {
  className?: string
}

/**
 * 로딩 표시는 스피너가 아니라 스켈레톤으로. 실제 콘텐츠와 같은 형태·높이를
 * className으로 지정해서 쓴다(예: `<Skeleton className="h-40 w-full rounded-2xl" />`).
 * 깜빡임은 opacity 애니메이션(`.skeleton` → `animate-shimmer`)만 쓴다 —
 * background-position 이동은 페인트 비용이 커서 쓰지 않는다.
 */
export function Skeleton({ className }: Props) {
  return <div aria-hidden className={cn('skeleton', className)} />
}

/** 텍스트 한 줄 자리. width는 tailwind 폭 클래스로("w-2/3" 등) */
export function SkeletonText({ className }: Props) {
  return <Skeleton className={cn('h-3.5 rounded-full', className)} />
}

/** 원형(아바타·포스터 썸네일 라운드) 자리 */
export function SkeletonCircle({ className }: Props) {
  return <Skeleton className={cn('aspect-square rounded-full', className)} />
}

export { SkeletonCard, SkeletonList } from './EmptyState'
