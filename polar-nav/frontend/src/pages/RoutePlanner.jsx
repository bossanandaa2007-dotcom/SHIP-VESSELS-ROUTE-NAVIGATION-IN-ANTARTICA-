import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Route as RouteIcon } from 'lucide-react'
import MapView from '../components/MapView'
import RecommendedRoute from '../components/RecommendedRoute'
import NextWaypointPanel from '../components/NextWaypointPanel'
import Card from '../components/Card'
import { computeRoute } from '../lib/api'

// Hardcoded voyage coordinates — the From/To text inputs are labels only.
const ORIGIN = { lat: -33.92, lon: 18.42 } // Cape Town
const DEST = { lat: -70.77, lon: 11.73 } // Maitri

export default function RoutePlanner() {
  const { ships, positions, icebergs } = useOutletContext()

  const [form, setForm] = useState({
    shipId: '',
    from: 'Cape Town (South Africa)',
    to: 'Maitri (Antarctica)',
    departure: '',
    vesselType: 'Research Vessel',
  })
  const [route, setRoute] = useState({ state: 'idle', data: null, error: null })

  useEffect(() => {
    if (!form.shipId && ships.length) {
      setForm((f) => ({ ...f, shipId: ships[0].id }))
    }
  }, [ships, form.shipId])

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
  }

  const planRoute = () => {
    if (!form.shipId) {
      setRoute({ state: 'error', data: null, error: 'Select a vessel first' })
      return
    }
    setRoute({ state: 'loading', data: null, error: null })
    computeRoute({
      shipId: form.shipId,
      originLat: ORIGIN.lat,
      originLon: ORIGIN.lon,
      destLat: DEST.lat,
      destLon: DEST.lon,
    })
      .then((data) => setRoute({ state: 'ready', data, error: null }))
      .catch((err) => setRoute({ state: 'error', data: null, error: err.message }))
  }

  const selectedShip = ships.find((s) => s.id === form.shipId)
  const demo = {
    vessel: selectedShip?.name ?? '—',
    from: form.from,
    to: form.to,
  }

  return (
    <div className="p-3 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-3">
      {/* form */}
      <Card title="Plan a Route" icon={RouteIcon}>
        <div className="space-y-3 text-sm">
          <Field label="Select Vessel">
            <select
              value={form.shipId}
              onChange={set('shipId')}
              className="w-full bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200"
            >
              {!ships.length && <option value="">No vessels in fleet</option>}
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Hint>real · ships table</Hint>
          </Field>

          <Field label="From">
            <input
              value={form.from}
              onChange={set('from')}
              className="w-full bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200"
            />
          </Field>
          <Field label="To">
            <input
              value={form.to}
              onChange={set('to')}
              className="w-full bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200"
            />
          </Field>

          <Field label="Departure Date">
            <input
              type="datetime-local"
              value={form.departure}
              onChange={set('departure')}
              className="w-full bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-300"
            />
            <Hint>UI only — not sent to the backend</Hint>
          </Field>

          <button
            type="button"
            onClick={planRoute}
            disabled={route.state === 'loading'}
            className="w-full py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-60"
          >
            {route.state === 'loading' ? 'Planning…' : 'Plan Route'}
          </button>

          <Field label="Vessel Type">
            <select
              value={form.vesselType}
              onChange={set('vesselType')}
              className="w-full bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-300"
            >
              <option>Research Vessel</option>
              <option>Supply Vessel</option>
              <option>Icebreaker</option>
              <option>Cargo</option>
            </select>
            <Hint>UI only</Hint>
          </Field>
        </div>
      </Card>

      {/* map + summary */}
      <div className="flex flex-col gap-3 min-w-0">
        <section className="relative rounded-xl overflow-hidden border border-[#1e293b] min-h-[440px] flex-1">
          <MapView
            ships={ships}
            positions={positions}
            icebergs={icebergs}
            routePath={route.data?.path}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RecommendedRoute title="Route Summary" demo={demo} route={route} fuelMock />
          <NextWaypointPanel demo={demo} route={route} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  )
}

function Hint({ children }) {
  return <span className="block text-[10px] text-slate-500 mt-1">{children}</span>
}
