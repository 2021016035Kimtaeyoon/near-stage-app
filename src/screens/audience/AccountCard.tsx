import { Check, LogIn, LogOut, Pencil, ShieldCheck, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput } from '@/components/ui/Field'
import { signOut, updateDisplayName, useAuthStore } from '@/hooks/useAuth'
import { toast } from '@/store/useToast'

/**
 * 계정 카드 — 로그인 진입점.
 *
 * 둘러보기는 로그인 없이 되므로, 로그인은 "필요할 때 뜨는 시트"가 기본입니다.
 * 다만 그것만 두면 로그인하고 싶은 사람이 누를 곳이 없어서, 마이 페이지에
 * 명시적인 진입점을 둡니다.
 */
export function AccountCard() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const userId = useAuthStore((s) => s.userId)
  const loading = useAuthStore((s) => s.loading)
  const requireAuth = useAuthStore((s) => s.requireAuth)
  const provider = useAuthStore((s) => s.provider)
  // ★ 카카오 닉네임이 그대로 박혀서 바꿀 방법이 없었습니다. 본명이 들어간 경우
  //   리뷰와 댓글에 그대로 노출됩니다.
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const saveName = async () => {
    setBusy(true)
    const err = await updateDisplayName(name)
    setBusy(false)
    if (err) {
      toast('바꾸지 못했어요', 'error', err)
      return
    }
    toast('이름을 바꿨어요', 'success')
    setEditing(false)
  }

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
          <span className="block text-[14px] font-bold">로그인 / 시작하기</span>
          <span className="mt-0.5 block text-2xs leading-snug text-ink-3">
            참석 예정·좋아요·알림을 쓰려면 로그인이 필요해요
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="card mb-4 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
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
          {editing ? (
            <div className="flex items-center gap-1.5">
              <TextInput
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveName()
                }}
                placeholder="표시할 이름"
                maxLength={20}
              />
              <button
                onClick={() => void saveName()}
                disabled={busy}
                aria-label="저장"
                className="bg-gold-500 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gold-ink disabled:opacity-40"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => setEditing(false)}
                aria-label="취소"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setName(profile?.displayName ?? '')
                  setEditing(true)
                }}
                className="flex items-center gap-1.5 text-left"
              >
                <span className="truncate text-[14px] font-bold">
                  {profile?.displayName || '이름 없는 사용자'}
                </span>
                <Pencil size={11} className="shrink-0 text-ink-3" />
              </button>
              <p className="mt-0.5 text-2xs text-ink-3">
                {profile?.isAdmin
                  ? '운영자 계정'
                  : provider === 'email'
                    ? '이메일로 로그인됨'
                    : '소셜 계정으로 로그인됨'}
              </p>
            </>
          )}
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

      {profile?.isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="flex w-full items-center gap-2 border-t border-border bg-surface-2 px-4 py-2.5 text-left"
        >
          <ShieldCheck size={14} className="shrink-0 text-gold-text" />
          <span className="flex-1 text-2xs font-bold">운영자 화면 열기</span>
          <span className="text-2xs text-ink-3">승인 · 지표</span>
        </button>
      )}
    </div>
  )
}
