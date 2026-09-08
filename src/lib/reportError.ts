import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/**
 * 클라이언트 오류를 서버에 남깁니다.
 *
 * ★ 개인정보를 담지 않습니다. 사용자 id 도 보내지 않습니다 — 누가 겪었는지가
 *   아니라 어디가 죽었는지가 필요합니다. user agent 는 브라우저 종류만 짧게 자릅니다.
 *
 * ★ 실패해도 조용히 넘어갑니다. 오류를 보고하다가 또 오류를 내면 무한 반복이
 *   되고, 사용자는 그걸 보게 됩니다.
 */

/** 같은 오류를 반복 전송하지 않습니다 — 렌더 루프에 걸리면 순식간에 수백 건이 됩니다 */
const sent = new Set<string>()
const MAX_PER_SESSION = 10

/** 'Chrome 131 / Android' 정도로 줄입니다. 전체 UA 는 지문이 됩니다 */
function shortAgent(): string {
  const ua = navigator.userAgent
  const browser =
    /Edg\/(\d+)/.exec(ua)?.[0] ??
    /Chrome\/(\d+)/.exec(ua)?.[0] ??
    /Firefox\/(\d+)/.exec(ua)?.[0] ??
    /Version\/(\d+).*Safari/.exec(ua)?.[0] ??
    'Unknown'
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Mac OS X/.test(ua)
        ? 'macOS'
        : /Windows/.test(ua)
          ? 'Windows'
          : 'Other'
  return `${browser.split('.')[0]} / ${os}`.slice(0, 120)
}

/** 해시 경로에서 id 를 지웁니다 — 같은 화면의 오류를 한 줄로 모으기 위함입니다 */
function normalizedRoute(): string {
  const hash = window.location.hash.replace(/^#/, '') || '/'
  return hash
    .split('?')[0]
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .slice(0, 200)
}

export function reportError(error: unknown, extra?: string): void {
  if (!isSupabaseConfigured) return

  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? (error.stack ?? '') : ''
  const route = normalizedRoute()

  const key = `${route}|${message}`
  if (sent.has(key) || sent.size >= MAX_PER_SESSION) return
  sent.add(key)

  void supabase
    .from('client_errors')
    .insert({
      route,
      message: message.slice(0, 500),
      stack: [extra, stack].filter(Boolean).join('\n').slice(0, 2000),
      agent: shortAgent(),
      app_build: import.meta.env.MODE,
    })
    .then(() => undefined, () => undefined)
}

/**
 * 잡히지 않은 오류와 거부된 프로미스도 모읍니다.
 *
 * 에러 경계는 렌더 중 오류만 잡습니다. 이벤트 핸들러나 async 안에서 터진 것은
 * 화면이 그대로라 아무도 모르고 지나갑니다.
 */
export function installErrorReporter(): void {
  window.addEventListener('error', (e) => {
    reportError(e.error ?? e.message, `window.onerror @ ${e.filename}:${e.lineno}`)
  })
  window.addEventListener('unhandledrejection', (e) => {
    reportError(e.reason, 'unhandledrejection')
  })
}
