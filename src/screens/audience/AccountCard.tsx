import { LogIn, LogOut, UserRound } from 'lucide-react'
import { signOut, useAuthStore } from '@/hooks/useAuth'
import { toast } from '@/store/useToast'

/**
 * 계정 카드 — 로그인 진입점.
 *
 * 둘러보기는 로그인 없이 되므로, 로그인은 "필요할 때 뜨는 시트"가 기본입니다.
 * 다만 그것만 두면 로그인하고 싶은 사람이 누를 곳이 없어서, 마이 페이지에
 * 명시적인 진입점을 둡니다.
 */
export function AccountCard() {
  const profile = useAuthStore((s) => s.profile)
  const userId = useAuthStore((s) => s.userId)
  const loading = useAuthStore((s) => s.loading)
  const requireAuth = useAuthStore((s) => s.requireAuth)

  if (loading) {
    return <div className="card mb-4 h-[76px] animate-pulse bg-surface-2" />
  }

  if (!userId) {
    return (
      <button
        onClick={() => requireAuth(() => toast('로그인됐어요', 'success'))}
        className="card mb-4 flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="bg-gold-500 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gold-ink">
          <LogIn size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold">카카오로 시작하기</span>
          <span className="mt-0.5 block text-2xs leading-snug text-ink-3">
            참석 예정·좋아요·알림을 쓰려면 로그인이 필요해요
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="card mb-4 flex items-center gap-3 px-4 py-3.5">
      {profile?.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3">
          <UserRound size={18} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold">
          {profile?.displayName || '이름 없는 사용자'}
        </p>
        <p className="mt-0.5 text-2xs text-ink-3">
          {profile?.isAdmin ? '운영자 계정' : '카카오 계정으로 로그인됨'}
        </p>
      </div>
      <button
        onClick={async () => {
          await signOut()
          toast('로그아웃했어요')
        }}
        aria-label="로그아웃"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 active:bg-surface-2"
      >
        <LogOut size={16} />
      </button>
    </div>
  )
}
