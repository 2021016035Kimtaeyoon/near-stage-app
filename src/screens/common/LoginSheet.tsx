import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { FREE_TRIAL_NOTICE, SERVICE_NAME } from '@/config/brand'
import { signInWith, signInWithEmail, useAuthStore, type AuthProvider } from '@/hooks/useAuth'
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
 * ★ 이메일 로그인은 비밀번호가 없습니다(매직링크). 비밀번호를 잊으면 재설정
 *   메일을 받아야 하는데, SMTP 를 붙이기 전엔 그 메일이 제때 안 갈 수 있어
 *   영구 잠김 사고로 이어집니다. 매직링크는 애초에 잊을 비밀번호가 없습니다.
 */

export function LoginSheet() {
  const open = useAuthStore((s) => s.sheetOpen)
  const navigate = useNavigate()
  const closeSheet = useAuthStore((s) => s.closeSheet)
  const [busy, setBusy] = useState<AuthProvider | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const start = async (provider: AuthProvider) => {
    setBusy(provider)
    const { error } = await signInWith(provider)
    if (error) {
      setBusy(null)
      toast('로그인을 시작하지 못했어요', 'error', error)
    }
    // 성공하면 provider 로 이동하므로 이 컴포넌트는 사라집니다
  }

  const sendMagicLink = async () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      toast('이메일 주소를 확인해주세요', 'warn')
      return
    }
    setEmailBusy(true)
    const { error } = await signInWithEmail(trimmed)
    setEmailBusy(false)
    if (error) {
      toast('링크를 보내지 못했어요', 'error', error)
      return
    }
    setSentTo(trimmed)
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        closeSheet()
        // 다음에 다시 열었을 때 지난번 상태가 남아 있지 않게 합니다
        setShowEmail(false)
        setSentTo(null)
        setEmail('')
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
        {!showEmail ? (
          <button
            onClick={() => setShowEmail(true)}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-[15px] font-bold text-ink-2"
          >
            <Mail size={17} />
            이메일로 계속하기
          </button>
        ) : sentTo ? (
          <div className="rounded-2xl border border-border bg-surface-2 p-4 text-center">
            <p className="text-[13px] font-bold">{sentTo}로 링크를 보냈어요</p>
            <p className="mt-1 text-2xs leading-relaxed text-ink-3">
              메일함(스팸함도 확인해주세요)에서 링크를 누르면 로그인됩니다.
            </p>
            <button
              onClick={() => setSentTo(null)}
              className="mt-2.5 text-2xs font-bold text-gold-text underline underline-offset-2"
            >
              다른 이메일로 다시 받기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <TextInput
              type="email"
              inputMode="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              onKeyDown={(e) => e.key === 'Enter' && void sendMagicLink()}
            />
            <Button full variant="brand" loading={emailBusy} onClick={() => void sendMagicLink()}>
              로그인 링크 받기
            </Button>
            <p className="text-2xs leading-relaxed text-ink-3">
              비밀번호가 없습니다. 메일로 온 링크를 누르면 바로 로그인돼요 — 처음
              쓰는 이메일이면 계정이 자동으로 만들어집니다.
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
