import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  UserCog,
  Ship,
  Database,
  Map as MapIcon,
  Sliders,
  Plug,
  LifeBuoy,
} from 'lucide-react'
import Card, { MockBadge } from '../components/Card'

export default function Settings() {
  const { ships, status } = useOutletContext()
  const [enabled, setEnabled] = useState({})

  const isOn = (id) => enabled[id] ?? true
  const toggle = (id) => setEnabled((e) => ({ ...e, [id]: !isOn(id) }))

  return (
    <div className="p-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Account */}
      <Card title="Account Settings" icon={UserCog} badge={<MockBadge />}>
        <div className="space-y-1 text-sm">
          <div className="text-slate-200 font-semibold">Fleet Operator</div>
          <div className="text-[11px] text-slate-500">fleet@company.com</div>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {['Organization', 'Users & Permissions', 'Notifications', 'Subscription'].map(
            (r) => (
              <li
                key={r}
                className="flex items-center justify-between border-b border-[#1e293b] pb-2"
              >
                {r}
                <span className="text-slate-600">›</span>
              </li>
            ),
          )}
        </ul>
        <button
          type="button"
          className="mt-3 w-full py-2 rounded-lg border border-[#1e293b] text-xs text-slate-300 hover:bg-slate-800"
        >
          Edit Profile
        </button>
        <p className="mt-3 text-[10px] text-slate-500">
          Placeholder — there is no real authentication yet.
        </p>
      </Card>

      {/* Vessel management — real ships */}
      <Card title="Vessel Management" icon={Ship}>
        {status === 'loading' ? (
          <p className="text-xs text-slate-500">Loading fleet…</p>
        ) : !ships.length ? (
          <p className="text-xs text-slate-500">No rows in the ships table yet.</p>
        ) : (
          <ul className="divide-y divide-[#1e293b]">
            {ships.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm text-slate-200">{s.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {s.ship_type || 'Vessel'}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn(s.id)}
                  onClick={() => toggle(s.id)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    isOn(s.id) ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                      isOn(s.id) ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="mt-3 w-full py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500"
        >
          + Add Vessel
        </button>
        <p className="mt-3 text-[10px] text-emerald-500/80">
          real · <code>ships</code> table · toggles are UI-only, not persisted
        </p>
      </Card>

      {/* System + help — static mock */}
      <div className="space-y-3">
        <Card title="System Settings" icon={Sliders} badge={<MockBadge />}>
          <ul className="space-y-2 text-sm text-slate-400">
            <Row icon={Database} label="Data Sources" sub="AIS, Open-Meteo, Copernicus" />
            <Row icon={MapIcon} label="Map Settings" sub="Layers, markers, units" />
            <Row icon={Sliders} label="Route Preferences" sub="Safety, fuel, weather" />
            <Row icon={Plug} label="API Integrations" sub="AIS, Open-Meteo, Copernicus" />
          </ul>
        </Card>

        <Card title="Help & Support" icon={LifeBuoy} badge={<MockBadge />}>
          <p className="text-sm text-slate-400">Need assistance?</p>
          <button
            type="button"
            className="mt-2 w-full py-2 rounded-lg border border-[#1e293b] text-xs text-slate-300 hover:bg-slate-800"
          >
            Contact Support
          </button>
        </Card>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, sub }) {
  return (
    <li className="flex items-center gap-3 border-b border-[#1e293b] pb-2">
      <Icon size={15} className="text-sky-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-slate-200 text-sm">{label}</div>
        <div className="text-[11px] text-slate-500">{sub}</div>
      </div>
      <span className="text-slate-600">›</span>
    </li>
  )
}
