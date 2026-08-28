import { HashRouter, useLocation } from 'react-router-dom'
import { DevPanel } from '@/components/shell/DevPanel'
import { PhoneFrame } from '@/components/shell/PhoneFrame'
import { RoleSwitcherFab, RoleSwitcherPanel } from '@/components/shell/RoleSwitcher'
import { TabBar } from '@/components/shell/TabBar'
import { ToastHost } from '@/components/ui/Toast'
import { isFullscreenRoute } from '@/lib/routeUtils'
import { AppRoutes } from '@/routes'
import { DemoCaptionBar } from '@/screens/demo/DemoCaptionBar'
import { DemoEngine } from '@/screens/demo/DemoEngine'
import { useAppStore } from '@/store/useAppStore'

function AppShell() {
  const { pathname } = useLocation()
  const fullscreen = isFullscreenRoute(pathname)
  const demoActive = useAppStore((s) => s.demo.active)

  return (
    <PhoneFrame side={<RoleSwitcherPanel />}>
      <div className="absolute inset-0">
        <AppRoutes />
      </div>
      {!fullscreen && !demoActive && <TabBar />}
      {!fullscreen && <RoleSwitcherFab />}
      <DevPanel />
      <ToastHost />
      <DemoEngine />
      <DemoCaptionBar />
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
