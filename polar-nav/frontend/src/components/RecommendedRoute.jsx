import { Route as RouteIcon, CheckCircle } from 'lucide-react'
import Card from './Card'
import { pathDistanceKm } from '../lib/format'

export default function RecommendedRoute({
  demo,
  route,
  title = 'Recommended Route',
  fuelMock = false,
}) {
  const { state, data, error } = route
  const km = data?.path ? pathDistanceKm(data.path) : null
  const hours = km != null ? km / (14 * 1.852) : null // rough @ 14 kn

  return (
    <Card
      title={title}
      icon={RouteIcon}
      action={
        <button
          type="button"
          className="text-[11px] px-2 py-1 rounded border border-[#1e293b] text-slate-300 hover:bg-slate-800"
        >
          View Details
        </button>
      }
    >
      <dl className="text-sm space-y-1.5">
        <Row k="Vessel" v={demo.vessel} />
        <Row k="From" v={demo.from} />
        <Row k="To" v={demo.to} />
        <Row
          k="Distance"
          v={km != null ? `${Math.round(km).toLocaleString()} km` : '—'}
          sub="great-circle sum of API path"
        />
        <Row
          k="Est. Time"
          v={
            hours != null
              ? `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`
              : '—'
          }
          sub="derived @ 14 kn"
        />
        <Row
          k="Risk score"
          v={data?.risk_score != null ? Number(data.risk_score).toFixed(1) : '—'}
          sub="A* path cost from /compute-route"
        />
        {fuelMock && (
          <Row k="Fuel Estimate" v="~ 820 t" sub="mock — backend doesn't compute fuel" />
        )}
      </dl>

      <div className="mt-3">
        {state === 'idle' && (
          <Pill className="bg-slate-700/40 text-slate-400">
            Waiting for a vessel in the fleet…
          </Pill>
        )}
        {state === 'loading' && (
          <Pill className="bg-slate-700/40 text-slate-300">Computing route…</Pill>
        )}
        {state === 'ready' && (
          <Pill className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle size={14} />
            Optimal route computed ({data.path?.length ?? 0} waypoints)
          </Pill>
        )}
        {state === 'error' && (
          <Pill className="bg-red-500/15 text-red-400 border border-red-500/30">
            /compute-route failed: {error}
          </Pill>
        )}
      </div>

      <p className="mt-2 text-[10px] text-emerald-500/80">
        real · POST <code>{'{VITE_API_BASE}'}/compute-route</code> · demo
        origin/destination
      </p>
    </Card>
  )
}

function Row({ k, v, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500 shrink-0">{k}</dt>
      <dd className="text-slate-200 text-right">
        {v}
        {sub && <span className="block text-[10px] text-slate-500">{sub}</span>}
      </dd>
    </div>
  )
}

function Pill({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${className}`}
    >
      {children}
    </span>
  )
}
