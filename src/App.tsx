import { HashRouter, useLocation } from 'react-router-dom'
import { DevPanel } from '@/components/shell/DevPanel'
import { PhoneFrame } from '@/components/shell/PhoneFrame'
import { RoleSwitcherFab, RoleSwitcherPanel } from '@/components/shell/RoleSwitcher'
import { TabBar } from '@/components/shell/TabBar'
import { ToastHost } from '@/components/ui/Toast'
import { isFullscreenRoute } from '@/lib/routeUtils'
import { AppRoutes } from '@/routes'

function AppShell() {
  const { pathname } = useLocation()
  const fullscreen = isFullscreenRoute(pathname)

  return (
    <PhoneFrame side={<RoleSwitcherPanel />}>
      <div className="absolute inset-0">
        <AppRoutes />
      </div>
      {!fullscreen && <TabBar />}
      {!fullscreen && <RoleSwitcherFab />}
      <DevPanel />
      <ToastHost />
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
