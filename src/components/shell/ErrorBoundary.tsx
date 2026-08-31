import { Component, type ReactNode } from 'react'
import { LogoMark } from './LogoMark'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** 화면 하나가 죽어도 전체가 흰 화면이 되지 않도록 감싸는 최상위 에러 경계 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown) {
    console.error(error)
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
