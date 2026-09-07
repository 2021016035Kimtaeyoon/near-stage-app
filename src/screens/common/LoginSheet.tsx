import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FREE_TRIAL_NOTICE, SERVICE_NAME } from '@/config/brand'
import { signInWithKakao, useAuthStore } from '@/hooks/useAuth'
import { toast } from '@/store/useToast'

/**
 * 로그인 시트.
 *
 * 둘러보기는 로그인 없이 됩니다. 등록·지원·참석처럼 "내 것이 생기는" 순간에만
 * 이 시트가 뜨고, 로그인이 끝나면 원래 누르려던 동작이 그대로 이어집니다.
 */
export function LoginSheet() {
  const open = useAuthStore((s) => s.sheetOpen)
  const closeSheet = useAuthStore((s) => s.closeSheet)
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setBusy(true)
    const { error } = await signInWithKakao()
    if (error) {
      setBusy(false)
      toast('로그인을 시작하지 못했어요', 'error', error)
    }
    // 성공하면 카카오로 이동하므로 이 컴포넌트는 사라집니다
  }

  return (
    <BottomSheet
      open={open}
      onClose={closeSheet}
      title="로그인이 필요해요"
      subtitle={`${SERVICE_NAME}는 카카오 계정으로 바로 시작할 수 있습니다`}
    >
      <button
        onClick={start}
        disabled={busy}
        className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-[15px] font-bold text-[#191600] disabled:opacity-60"
      >
        <KakaoMark />
        {busy ? '카카오로 이동 중…' : '카카오로 3초 만에 시작하기'}
      </button>

      <ul className="mt-5 space-y-2 text-xs leading-relaxed text-ink-2">
        <li>· 닉네임과 프로필 사진만 받습니다. 전화번호·이메일은 받지 않습니다.</li>
        <li>· {FREE_TRIAL_NOTICE}</li>
        <li>· 공연 둘러보기는 로그인 없이도 계속 하실 수 있어요.</li>
      </ul>

      <p className="mt-4 text-2xs leading-relaxed text-ink-3">
        로그인하면 <span className="font-semibold text-ink-2">이용약관</span>과{' '}
        <span className="font-semibold text-ink-2">개인정보처리방침</span>에 동의하는 것으로
        봅니다. 만 14세 미만은 가입할 수 없습니다.
      </p>
    </BottomSheet>
  )
}

/** 카카오 말풍선 마크 */
function KakaoMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.5-.8 2.9-.1.5.2.5.4.4.2-.1 2.6-1.8 3.6-2.5.6.1 1.2.1 1.7.1 5.1 0 9.2-3.3 9.2-7.3S17.1 3 12 3z" />
    </svg>
  )
}
