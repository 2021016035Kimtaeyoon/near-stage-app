import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { installErrorReporter } from './lib/reportError'

// ★ 에러 경계는 렌더 중 오류만 잡습니다. 이벤트 핸들러나 async 안에서 터진 것은
// 화면이 그대로라 아무도 모르고 지나갑니다. 그래서 전역 리스너도 함께 답니다.
installErrorReporter()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
