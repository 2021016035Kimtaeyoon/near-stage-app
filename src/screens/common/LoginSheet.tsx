import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FREE_TRIAL_NOTICE, SERVICE_NAME } from '@/config/brand'
import { signInWith, useAuthStore, type AuthProvider } from '@/hooks/useAuth'
import { toast } from '@/store/useToast'

/**
 * 로그인 시트.
 *
 * 둘러보기는 로그인 없이 됩니다. 등록·지원·참석처럼 "내 것이 생기는" 순간에만
 * 이 시트가 뜨고, 로그인이 끝나면 원래 누르려던 동작이 그대로 이어집니다.
 *
 * 카카오 버튼은 비즈 앱 전환이 끝나야 동작합니다(useAuth.ts 의 설명 참고).
 * 그전에는 눌러도 카카오가 KOE205 로 거부하므로, 이유를 화면에 밝히고 구글을
 * 앞에 둡니다. 사용자를 아무 설명 없이 에러 페이지로 보내지 않기 위함입니다.
 */
const KAKAO_READY = false

export function LoginSheet() {
  const open = useAuthStore((s) => s.sheetOpen)
  const closeSheet = useAuthStore((s) => s.closeSheet)
  const [busy, setBusy] = useState<AuthProvider | null>(null)

  const start = async (provider: AuthProvider) => {
    setBusy(provider)
    const { error } = await signInWith(provider)
    if (error) {
      setBusy(null)
      toast('로그인을 시작하지 못했어요', 'error', error)
    }
    // 성공하면 provider 로 이동하므로 이 컴포넌트는 사라집니다
  }

  return (
    <BottomSheet
      open={open}
      onClose={closeSheet}
      title="로그인이 필요해요"
      subtitle={`${SERVICE_NAME}는 소셜 계정으로 바로 시작할 수 있습니다`}
    >
      <div className="space-y-2.5">
        <button
          onClick={() => start('google')}
          disabled={busy !== null}
          className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl border border-border-strong bg-surface text-[15px] font-bold text-ink disabled:opacity-60"
        >
          <GoogleMark />
          {busy === 'google' ? '구글로 이동 중…' : '구글로 시작하기'}
        </button>

        <button
          onClick={() => start('kakao')}
          disabled={busy !== null || !KAKAO_READY}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-[15px] font-bold text-[#191600] disabled:opacity-45"
        >
          <KakaoMark />
          {busy === 'kakao' ? '카카오로 이동 중…' : '카카오로 시작하기'}
        </button>
        {!KAKAO_READY && (
          <p className="text-2xs leading-relaxed text-ink-3">
            카카오 로그인은 준비 중입니다. 카카오가 이메일 항목을 사업자 인증된 앱에만
            열어주는데, 로그인 연동이 그 항목을 함께 요구해서 아직 켤 수 없습니다.
          </p>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-xs leading-relaxed text-ink-2">
        <li>· 이름과 프로필 사진만 받습니다. 전화번호는 받지 않습니다.</li>
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

/** 구글 G 마크 (브랜드 4색) */
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}
