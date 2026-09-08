import { Component, type ReactNode } from 'react'
import { reportError } from '@/lib/reportError'
import { LogoMark } from './LogoMark'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  /** 개발 모드에서만 화면에 보여줍니다. 배포 빌드에서는 쓰지 않습니다 */
  detail: string | null
}

/** 화면 하나가 죽어도 전체가 흰 화면이 되지 않도록 감싸는 최상위 에러 경계 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, detail: null }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      detail: error instanceof Error ? `${error.message}
${error.stack ?? ''}` : String(error),
    }
  }

  override componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // 개발 중에는 어느 컴포넌트가 죽었는지 화면에서 바로 보여야 고칠 수 있습니다.
    console.error(error, info.componentStack)
    // ★ 배포 후에는 사용자가 말해주지 않으면 크래시를 알 수 없습니다. 서버에 남깁니다.
    reportError(error, info.componentStack ?? undefined)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
          <LogoMark className="w-[120px]" />
          <p className="text-sm leading-relaxed text-ink-2">
            화면을 불러오는 중 문제가 생겼어요.
            <br />
            새로고침하면 대부분 바로 해결돼요.
          </p>
          {import.meta.env.DEV && this.state.detail && (
            <pre className="max-h-64 w-full max-w-xl overflow-auto rounded-xl bg-surface-2 p-3 text-left text-[11px] leading-relaxed text-ink-2">
              {this.state.detail}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-gold-500 rounded-full px-5 py-3 text-sm font-bold text-gold-ink"
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
