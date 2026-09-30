import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ship,
  Route,
  CloudSnow,
  Settings,
  Mountain,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/fleet-tracking', label: 'Fleet Tracking', icon: Ship },
  { to: '/route-planner', label: 'Route Planner', icon: Route },
  { to: '/weather-ice', label: 'Weather & Ice', icon: CloudSnow },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <nav className="w-56 shrink-0 bg-[#0b1322] border-r border-[#1e293b] p-3 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <Mountain className="text-sky-400" size={22} />
        <span className="font-semibold text-white text-sm">Polar Nav</span>
      </div>

      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`
          }
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto px-3 text-[10px] text-slate-600">
        Prototype · single fleet operator
      </div>
    </nav>
  )
}
