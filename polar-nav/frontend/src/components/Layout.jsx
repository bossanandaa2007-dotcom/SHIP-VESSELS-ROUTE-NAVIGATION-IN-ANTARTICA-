import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import { useFleet } from '../hooks/useFleet'
import { useIcebergs } from '../hooks/useIcebergs'

/**
 * App shell: top bar + sidebar + routed page area.
 * Fleet + iceberg data is loaded once here and handed to every page
 * through the router outlet context, so pages don't each re-query or
 * re-subscribe.
 */
export default function Layout() {
  const fleet = useFleet()
  const { icebergs, error: icebergError } = useIcebergs()

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0f1e] text-slate-200 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet context={{ ...fleet, icebergs, icebergError }} />
        </main>
      </div>
    </div>
  )
}
