import { Ship } from 'lucide-react'
import Card from './Card'
import { fmtTimeUTC } from '../lib/format'

export default function ActiveVesselsTable({
  ships,
  positions,
  status,
  error,
  title = 'Active Vessels',
  onSelectShip,
  selectedShipId,
}) {
  const rows = (ships ?? []).map((s) => ({ ship: s, pos: positions?.[s.id] ?? null }))
  const online = rows.filter((r) => r.pos).length

  return (
    <Card
      title={title}
      icon={Ship}
      action={
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {online} online
        </span>
      }
    >
      {status === 'error' ? (
        <p className="text-xs text-red-400">Couldn&apos;t load fleet: {error}</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500">
          {status === 'loading'
            ? 'Loading fleet…'
            : 'No vessels in the ships table yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-72">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0e1729]">
              <tr className="text-[11px] uppercase tracking-wide text-slate-500 text-left">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Speed</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {rows.map(({ ship, pos }) => (
                <tr
                  key={ship.id}
                  onClick={() => onSelectShip?.(ship)}
                  className={
                    onSelectShip
                      ? `cursor-pointer hover:bg-slate-800/40 ${
                          ship.id === selectedShipId ? 'bg-sky-500/10' : ''
                        }`
                      : ''
                  }
                >
                  <td className="py-2 text-slate-200">{ship.name}</td>
                  <td className="py-2 text-slate-300 tabular-nums">
                    {pos?.speed_knots != null
                      ? `${Number(pos.speed_knots).toFixed(1)} kn`
                      : '—'}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        pos ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pos ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                      {pos ? 'On Route' : 'No signal'}
                    </span>
                  </td>
                  <td className="py-2 text-slate-400 tabular-nums">
                    {pos ? fmtTimeUTC(pos.recorded_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[10px] text-emerald-500/80">
        real · <code>ships</code> + <code>ship_positions</code> (Realtime)
      </p>
    </Card>
  )
}
