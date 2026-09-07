import { useEffect } from 'react'
import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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
      if (uid) void loadProfile(uid)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return
      const uid = session?.user.id ?? null
      setSession(uid)
      if (uid) {
        void loadProfile(uid)
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

/** 카카오 로그인 — 현재 화면으로 되돌아옵니다 */
export async function signInWithKakao(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase 설정이 없어 로그인할 수 없습니다.' }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
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
