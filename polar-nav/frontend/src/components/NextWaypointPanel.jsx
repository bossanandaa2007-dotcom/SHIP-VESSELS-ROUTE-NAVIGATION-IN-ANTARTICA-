import { MapPin } from 'lucide-react'
import Card from './Card'

export default function NextWaypointPanel({ demo, route }) {
  const path = route.data?.path ?? []
  const has = path.length > 1

  return (
    <Card
      title="Next Waypoint"
      icon={MapPin}
      action={<span className="text-[11px] text-slate-500">{demo.vessel}</span>}
    >
      {!has ? (
        <p className="text-xs text-slate-500">
          {route.state === 'error'
            ? 'No route — /compute-route failed.'
            : route.state === 'loading'
              ? 'Computing…'
              : 'No route yet.'}
        </p>
      ) : (
        <>
          <div className="flex gap-3">
            <Preview path={path} />
            <div className="text-xs space-y-1 flex-1 min-w-0">
              <div className="text-slate-300">
                {path.length} waypoints · {demo.from} → {demo.to}
              </div>
              <WP i={1} p={path[0]} />
              <WP i={2} p={path[1]} />
              <WP i={path.length} p={path[path.length - 1]} last />
              <div className="text-[10px] text-slate-500 pt-1">
                Per-waypoint ETA not shown — <code>/compute-route</code> returns
                geometry + risk only.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 border-t-2 border-dashed border-emerald-400" />
              Route (real)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              Waypoints (real)
            </span>
          </div>
        </>
      )}
    </Card>
  )
}

function WP({ i, p, last }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-1.5 h-1.5 rounded-full ${last ? 'bg-emerald-400' : 'bg-slate-500'}`}
      />
      <span className="text-slate-400">WP {i}</span>
      <span className="text-slate-300 tabular-nums">
        {p[0].toFixed(2)}, {p[1].toFixed(2)}
      </span>
    </div>
  )
}

function Preview({ path }) {
  const lats = path.map((p) => p[0])
  const lons = path.map((p) => p[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const w = 120
  const h = 96
  const pad = 8
  const sx = (lon) => pad + ((lon - minLon) / (maxLon - minLon || 1)) * (w - 2 * pad)
  const sy = (lat) => pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (h - 2 * pad)
  const d = path
    .map((p, i) => `${i ? 'L' : 'M'}${sx(p[1]).toFixed(1)} ${sy(p[0]).toFixed(1)}`)
    .join(' ')

  return (
    <svg
      width={w}
      height={h}
      className="shrink-0 rounded-md bg-[#0b1322] border border-[#1e293b]"
    >
      <path d={d} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
      {path.map((p, i) => (
        <circle key={i} cx={sx(p[1])} cy={sy(p[0])} r="1.6" fill="#cbd5e1" />
      ))}
    </svg>
  )
}
