import { Link, useLocation } from 'react-router-dom'
import { Globe2, Snowflake } from 'lucide-react'

const VIEWS = [
  {
    to: '/fleet-tracking',
    label: 'World Map',
    icon: Globe2,
    match: (path) => path === '/fleet-tracking',
  },
  { to: '/', label: 'Antarctica Map', icon: Snowflake, match: (path) => path === '/' },
]

/**
 * Two explicit buttons for jumping between the Dashboard's Antarctica-
 * focused map and Fleet Tracking's global map — on top of the sidebar,
 * which already routes between the two pages these maps live on.
 */
export default function MapSwitcher() {
  const { pathname } = useLocation()

  return (
    <div className="flex gap-2">
      {VIEWS.map(({ to, label, icon: Icon, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              active
                ? 'bg-sky-600 border-sky-600 text-white'
                : 'bg-[#0b1322] border-[#1e293b] text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon size={13} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
