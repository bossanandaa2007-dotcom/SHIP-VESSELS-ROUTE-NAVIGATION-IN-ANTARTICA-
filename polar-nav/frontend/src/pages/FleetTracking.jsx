import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search, Ship, MapPin, Navigation, Clock } from 'lucide-react'
import MapView from '../components/MapView'
import MapSwitcher from '../components/MapSwitcher'
import ActiveVesselsTable from '../components/ActiveVesselsTable'
import Card from '../components/Card'
import { fmtTimeUTC } from '../lib/format'

export default function FleetTracking() {
  const { ships, positions, icebergs, status, error } = useOutletContext()
  const [selectedShipId, setSelectedShipId] = useState(null)

  // Always re-derived from live context data so the details card updates
  // in place when the selected ship's position changes via Realtime.
  const selected = ships.find((s) => s.id === selectedShipId) ?? ships[0]
  const selectedPos = selected ? positions[selected.id] : null

  return (
    <div className="p-3 h-full flex flex-col gap-3">
      <div className="shrink-0">
        <MapSwitcher />
      </div>

      {/* filter bar — UI only, not wired to filtering yet */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search vessel…"
            className="w-full bg-[#0b1322] border border-[#1e293b] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-600"
          />
        </div>
        <select className="bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300">
          <option>All Vessels</option>
          <option>On Route</option>
          <option>No signal</option>
        </select>
        <select className="bg-[#0b1322] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300">
          <option>Live</option>
          <option>Last 24h</option>
        </select>
        <span className="text-[10px] text-slate-500">filters are UI-only for now</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-3 flex-1 min-h-0">
        <section className="relative rounded-xl overflow-hidden border border-[#1e293b] min-h-[320px]">
          <MapView
            ships={ships}
            positions={positions}
            icebergs={icebergs}
            onSelectShip={(ship) => setSelectedShipId(ship.id)}
          />
        </section>

        <div className="flex flex-col gap-3 overflow-y-auto">
          <ActiveVesselsTable
            title="Fleet List"
            ships={ships}
            positions={positions}
            status={status}
            error={error}
            selectedShipId={selected?.id}
            onSelectShip={(ship) => setSelectedShipId(ship.id)}
          />

          <Card title="Vessel Details" icon={Ship}>
            {!selected ? (
              <p className="text-xs text-slate-500">
                {status === 'loading' ? 'Loading fleet…' : 'No vessels in the fleet yet.'}
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-slate-200 font-semibold">{selected.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {selectedPos?.speed_knots != null
                      ? `${Number(selectedPos.speed_knots).toFixed(1)} kn`
                      : 'speed —'}{' '}
                    · Status: {selectedPos ? 'On Route' : 'No signal'}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <MapPin size={14} className="mt-0.5 text-sky-400" />
                  <span>
                    Current location:{' '}
                    <span className="text-slate-200">
                      {selectedPos
                        ? `${Number(selectedPos.lat).toFixed(2)}, ${Number(selectedPos.lon).toFixed(2)}`
                        : '—'}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <Clock size={14} className="mt-0.5 text-slate-500" />
                  <span>
                    Last update:{' '}
                    <span className="text-slate-200">
                      {selectedPos ? fmtTimeUTC(selectedPos.recorded_at) : '—'}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <Navigation size={14} className="mt-0.5 text-slate-500" />
                  <span>
                    Destination: <span className="text-slate-300">Maitri (Antarctica)</span>{' '}
                    <span className="text-amber-400/80">(mock)</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-1 w-full py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500"
                >
                  View Route
                </button>
              </div>
            )}
            <p className="mt-3 text-[10px] text-emerald-500/80">
              real · <code>ships</code> + <code>ship_positions</code> · click a
              marker or a Fleet List row to select a vessel
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
