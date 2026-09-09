import { useEffect } from 'react'
import { create } from 'zustand'
import { describeDbError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { LEGAL_UPDATED_AT } from '@/config/legal'
import type { UserProfile } from '@/types'

/**
 * 로그인 상태.
 *
 * ★ 역할(호스트/아티스트/관객)은 계정 속성이 아닙니다. 공간을 가지고 있으면 호스트,
 *   팀을 가지고 있으면 아티스트, 아무것도 없으면 관객입니다. 그래서 여기에는 role 이
 *   없고, 보유 리소스는 useMyVenues / useMyArtists 훅이 따로 읽습니다.
 *
 * 로그인이 필요한 액션을 눌렀을 때는 `pendingAction` 에 그 동작을 담아두고 로그인
 * 시트를 띄웁니다. 로그인이 끝나면 담아둔 동작을 그대로 이어서 실행합니다 —
 * 사용자가 "뭘 누르려 했는지"를 다시 찾아 헤매지 않게 하기 위함입니다.
 */
interface AuthState {
  /** 아직 세션을 확인하는 중 */
  loading: boolean
  userId: string | null
  profile: UserProfile | null
  /** 로그인 시트가 열려 있는지 */
  sheetOpen: boolean
  /** 로그인 후 이어서 실행할 동작 */
  pendingAction: (() => void) | null

  setSession: (userId: string | null) => void
  setProfile: (profile: UserProfile | null) => void
  /** 로그인이 필요한 동작을 감쌉니다. 로그인 상태면 즉시 실행, 아니면 시트를 띄웁니다 */
  requireAuth: (action: () => void) => void
  closeSheet: () => void
  runPending: () => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  loading: true,
  userId: null,
  profile: null,
  sheetOpen: false,
  pendingAction: null,

  setSession: (userId) => set({ userId, loading: false }),
  setProfile: (profile) => set({ profile }),

  requireAuth: (action) => {
    if (get().userId) {
      action()
      return
    }
    set({ sheetOpen: true, pendingAction: action })
  },

  closeSheet: () => set({ sheetOpen: false, pendingAction: null }),

  runPending: () => {
    const action = get().pendingAction
    set({ sheetOpen: false, pendingAction: null })
    action?.()
  },
}))

/**
 * 지금 버전(LEGAL_UPDATED_AT)의 약관·개인정보처리방침 동의를 기록합니다.
 *
 * ★ 이미 이 버전으로 기록돼 있으면 아무 일도 하지 않습니다. unique(user_id,
 *   kind, version) 제약이 있어 중복 삽입은 23505 로 실패하는데, 그건 정상
 *   흐름이라 오류로 취급하지 않습니다. 약관이 개정되어 LEGAL_UPDATED_AT 이
 *   바뀌면 그 다음 로그인 때 새 버전으로 한 행이 더 쌓입니다.
 *
 * ★ 실패해도 로그인 자체를 막지 않습니다. 기록은 증거를 남기는 일이지,
 *   사용을 막는 문지기가 아닙니다.
 */
async function recordConsent(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  // ★ 한 INSERT 문에 두 행을 같이 넣지 않습니다. Postgres 의 다중 행 INSERT 는
  //   원자적이라, 'terms' 는 이미 기록돼 있고 'privacy' 만 새 값이어도 통째로
  //   실패해 'privacy' 마저 기록되지 않습니다. 따로따로 보내야 한쪽이 이미
  //   있어도(23505) 다른 쪽은 정상적으로 남습니다.
  await Promise.all(
    (['terms', 'privacy'] as const).map((kind) =>
      supabase.from('consents').insert({ user_id: userId, kind, version: LEGAL_UPDATED_AT }),
    ),
  )
  // 결과를 보지 않습니다 — 이미 기록돼 있어서 나는 23505 도, 그 밖의 실패도
  // 로그인 흐름에 영향을 주면 안 됩니다.
}

/**
 * 앱 최상단에서 한 번만 호출합니다.
 * 세션을 읽고, 로그인/로그아웃을 구독하고, 프로필을 함께 불러옵니다.
 */
export function useAuthSync(): void {
  const setSession = useAuthStore((s) => s.setSession)
  const setProfile = useAuthStore((s) => s.setProfile)
  const runPending = useAuthStore((s) => s.runPending)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      return
    }

    let alive = true

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, is_admin')
        .eq('id', userId)
        .single()
      if (!alive) return
      if (error || !data) {
        setProfile(null)
        return
      }
      setProfile({
        id: data.id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url ?? undefined,
        isAdmin: data.is_admin,
      })
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      const uid = data.session?.user.id ?? null
      setSession(uid)
      if (uid) {
        void loadProfile(uid)
        void recordConsent(uid)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return
      const uid = session?.user.id ?? null
      setSession(uid)
      if (uid) {
        void loadProfile(uid)
        // ★ 로그인 시트에 "로그인하면 동의하는 것으로 봅니다"라고 적어뒀을 뿐
        //   실제로 남기는 기록이 없었습니다. 세션이 확인될 때마다(새로 로그인한
        //   경우든, 기존 세션을 다시 불러온 경우든) 지금 버전에 아직 동의
        //   기록이 없으면 한 번 남깁니다 — unique 제약이 있어 두 번 불러도
        //   행이 늘지 않습니다.
        void recordConsent(uid)
        // 로그인하려고 중단됐던 동작을 이어서 실행합니다
        if (event === 'SIGNED_IN') runPending()
      } else {
        setProfile(null)
      }
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [setSession, setProfile, runPending])
}

/**
 * 소셜 로그인.
 *
 * ★ 카카오는 지금 쓸 수 없습니다.
 *   Supabase 의 카카오 provider 가 scope 에 account_email 을 하드코딩해 넣고,
 *   options.scopes 는 그것을 대체하지 않고 뒤에 덧붙이기만 합니다. authorize
 *   엔드포인트를 직접 호출해 확인한 결과입니다.
 *
 *     scopes 지정 없음 → account_email profile_image profile_nickname
 *     scopes 지정      → account_email profile_image profile_nickname (+지정값 중복)
 *
 *   한편 카카오는 동의항목에 설정되지 않은 항목을 요청하면 KOE205 로 거부하고,
 *   '카카오계정(이메일)'은 비즈 앱으로 전환하지 않은 개인 앱에서는 설정 자체가
 *   불가능합니다. 즉 양쪽 다 우리가 손댈 수 없어서 지금은 막혀 있습니다.
 *
 *   카카오 코드는 그대로 둡니다 — 비즈 앱 전환이 끝나고 동의항목에서 이메일을
 *   선택 동의로 열면 아무 수정 없이 바로 동작합니다.
 */
export type AuthProvider = 'kakao' | 'google'

export const PROVIDER_LABEL: Record<AuthProvider, string> = {
  kakao: '카카오',
  google: '구글',
}

export async function signInWith(provider: AuthProvider): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase 설정이 없어 로그인할 수 없습니다.' }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // HashRouter 라 해시까지 포함해 돌려보내야 원래 보던 화면으로 복귀합니다
      redirectTo: window.location.href,
    },
  })
  return { error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/**
 * 표시 이름 변경.
 *
 * ★ 카카오 닉네임이 그대로 박혀서 바꿀 방법이 없었습니다. 본명이 들어간 경우
 *   공연 리뷰와 댓글에 그대로 노출됩니다 — 바꿀 수 있어야 합니다.
 *
 * profiles_update_own 이 본인 행만 허용합니다(0003).
 */
export async function updateDisplayName(name: string): Promise<string | null> {
  const uid = useAuthStore.getState().userId
  if (!uid) return '로그인이 필요합니다'
  const trimmed = name.trim()
  if (!trimmed) return '이름을 비워둘 수 없어요'
  if (trimmed.length > 20) return '20자 이하로 적어주세요'

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', uid)
  if (error) return describeDbError(error)

  // 화면에 바로 반영합니다. 다시 읽어오면 한 박자 늦게 바뀝니다.
  const cur = useAuthStore.getState().profile
  if (cur) useAuthStore.setState({ profile: { ...cur, displayName: trimmed } })
  return null
}
