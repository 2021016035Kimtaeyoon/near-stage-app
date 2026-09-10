import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { FREE_TRIAL_NOTICE, SERVICE_NAME } from '@/config/brand'
import {
  signInWith,
  signInWithPassword,
  signUpWithPassword,
  useAuthStore,
  type AuthProvider,
} from '@/hooks/useAuth'
import { isKakaoConfigured, startKakaoLogin } from '@/hooks/useKakaoLogin'
import { toast } from '@/store/useToast'

/**
 * 로그인 시트.
 *
 * 둘러보기는 로그인 없이 됩니다. 등록·지원·참석처럼 "내 것이 생기는" 순간에만
 * 이 시트가 뜨고, 로그인이 끝나면 원래 누르려던 동작이 그대로 이어집니다.
 *
 * 카카오는 Supabase 의 OAuth provider 를 쓰지 않습니다 — 그쪽은 scope 에
 * account_email 을 강제로 넣어 비즈 앱이 아닌 앱에서는 KOE205 로 막힙니다.
 * 대신 OIDC id_token 방식(useKakaoLogin.ts)으로 우리가 직접 요청합니다.
 *
 * ★ 이메일은 비밀번호 방식이고 이메일 인증이 없습니다(hooks/useAuth.ts 의
 *   signUpWithPassword 주석 참고) — 메일을 한 통도 안 보내고 앱 안에서 바로
 *   끝납니다. 대신 "비밀번호 찾기"가 없습니다. 잊으면 지금은 복구가 안 됩니다.
 */

export function LoginSheet() {
  const open = useAuthStore((s) => s.sheetOpen)
  const navigate = useNavigate()
  const closeSheet = useAuthStore((s) => s.closeSheet)
  const [busy, setBusy] = useState<AuthProvider | null>(null)
  const [emailMode, setEmailMode] = useState<'closed' | 'signin' | 'signup'>('closed')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)

  const start = async (provider: AuthProvider) => {
    setBusy(provider)
    const { error } = await signInWith(provider)
    if (error) {
      setBusy(null)
      toast('로그인을 시작하지 못했어요', 'error', error)
    }
    // 성공하면 provider 로 이동하므로 이 컴포넌트는 사라집니다
  }

  const submitEmail = async () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      toast('이메일 주소를 확인해주세요', 'warn')
      return
    }
    if (password.length < 6) {
      toast('비밀번호는 6자 이상으로 적어주세요', 'warn')
      return
    }
    setEmailBusy(true)
    const { error } =
      emailMode === 'signup'
        ? await signUpWithPassword(trimmed, password)
        : await signInWithPassword(trimmed, password)
    setEmailBusy(false)
    if (error) {
      toast(
        emailMode === 'signup' ? '가입하지 못했어요' : '로그인하지 못했어요',
        'error',
        emailMode === 'signup' ? error : '이메일이나 비밀번호를 확인해주세요',
      )
      return
    }
    // 성공하면 세션이 즉시 생겨 useAuthSync 가 시트를 닫고 이어서 실행합니다
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        closeSheet()
        // 다음에 다시 열었을 때 지난번 상태가 남아 있지 않게 합니다
        setEmailMode('closed')
        setEmail('')
        setPassword('')
      }}
      title="로그인이 필요해요"
      subtitle={`${SERVICE_NAME}는 소셜 계정으로 바로 시작할 수 있습니다`}
    >
      <div className="space-y-2.5">
        {isKakaoConfigured && (
          <button
            onClick={() => {
              setBusy('kakao')
              startKakaoLogin()
            }}
            disabled={busy !== null}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-[15px] font-bold text-[#191600] disabled:opacity-60"
          >
            <KakaoMark />
            {busy === 'kakao' ? '카카오로 이동 중…' : '카카오로 시작하기'}
          </button>
        )}

        <button
          onClick={() => start('google')}
          disabled={busy !== null}
          className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl border border-border-strong bg-surface text-[15px] font-bold text-ink disabled:opacity-60"
        >
          <GoogleMark />
          {busy === 'google' ? '구글로 이동 중…' : '구글로 시작하기'}
        </button>

        {/* ★ 소셜 계정이 없는 사람을 위한 세 번째 길입니다. 처음부터 입력창을
            보여주면 화면이 복잡해져서, 누르기 전엔 버튼 하나로만 둡니다. */}
        {emailMode === 'closed' ? (
          <button
            onClick={() => setEmailMode('signup')}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-[15px] font-bold text-ink-2"
          >
            <Mail size={17} />
            이메일로 계속하기
          </button>
        ) : (
          <div className="space-y-2">
            <TextInput
              type="email"
              inputMode="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
            />
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              onKeyDown={(e) => e.key === 'Enter' && void submitEmail()}
            />
            <Button full variant="brand" loading={emailBusy} onClick={() => void submitEmail()}>
              {emailMode === 'signup' ? '가입하기' : '로그인하기'}
            </Button>
            <p className="text-center text-2xs text-ink-3">
              {emailMode === 'signup' ? (
                <>
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => setEmailMode('signin')}
                    className="font-bold text-gold-text underline underline-offset-2"
                  >
                    로그인
                  </button>
                </>
              ) : (
                <>
                  처음이신가요?{' '}
                  <button
                    onClick={() => setEmailMode('signup')}
                    className="font-bold text-gold-text underline underline-offset-2"
                  >
                    회원가입
                  </button>
                </>
              )}
            </p>
            {/* ★ 없는 기능을 있는 척하지 않습니다. "비밀번호 찾기" 버튼을 만들고
                눌렀을 때 아무 일도 안 일어나게 하느니, 처음부터 없다고 말합니다. */}
            <p className="text-2xs leading-relaxed text-ink-3">
              메일 인증이 없어 비밀번호 찾기를 아직 지원하지 않아요. 비밀번호를
              꼭 기억해두세요.
            </p>
          </div>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-xs leading-relaxed text-ink-2">
        <li>· 소셜 로그인은 이름과 프로필 사진만, 이메일 로그인은 이메일 주소만 받습니다. 전화번호는 받지 않습니다.</li>
        <li>· {FREE_TRIAL_NOTICE}</li>
        <li>· 공연 둘러보기는 로그인 없이도 계속 하실 수 있어요.</li>
      </ul>

      {/* ★ 약관을 굵은 글씨로만 두면 읽을 방법이 없습니다. 동의를 받는 문서는
          그 자리에서 열 수 있어야 합니다 (§16) */}
      <p className="mt-4 text-2xs leading-relaxed text-ink-3">
        로그인하면{' '}
        <button
          onClick={() => {
            closeSheet()
            navigate('/legal/terms')
          }}
          className="font-semibold text-gold-text underline underline-offset-2"
        >
          이용약관
        </button>
        과{' '}
        <button
          onClick={() => {
            closeSheet()
            navigate('/legal/privacy')
          }}
          className="font-semibold text-gold-text underline underline-offset-2"
        >
          개인정보처리방침
        </button>
        에 동의하는 것으로 봅니다. 만 14세 미만은 가입할 수 없습니다.
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
