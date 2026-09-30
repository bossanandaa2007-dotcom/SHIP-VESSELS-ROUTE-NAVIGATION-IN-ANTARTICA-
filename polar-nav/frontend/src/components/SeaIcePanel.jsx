import { useEffect, useState } from 'react'
import { Snowflake } from 'lucide-react'
import Card from './Card'
import { supabase } from '../supabaseClient'

const BANDS = [
  { label: '0–15%', color: '#38bdf8' },
  { label: '15–30%', color: '#60a5fa' },
  { label: '30–60%', color: '#818cf8' },
  { label: '60–100%', color: '#c084fc' },
]

export default function SeaIcePanel() {
  const [avg, setAvg] = useState(null)
  const [count, setCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('ice_snapshots')
      .select('concentration')
      .limit(5000)
      .then(({ data }) => {
        if (!active) return
        const vals = (data ?? [])
          .map((r) => Number(r.concentration))
          .filter((v) => Number.isFinite(v))
        setCount(vals.length)
        setAvg(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null)
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const pct = avg == null ? null : Math.round(avg)

  return (
    <Card title="Sea Ice Information" icon={Snowflake} live>
      <div className="flex items-center gap-4">
        <Donut value={pct} />
        <div>
          <div className="text-2xl font-bold text-white">
            {pct == null ? (loaded ? 'n/a' : '…') : `${pct}%`}
          </div>
          <div className="text-[11px] text-slate-400">Mean ice concentration</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">
            real · average of {count} <code>ice_snapshots</code> row
            {count === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-3 text-[11px] text-slate-300">
        {BANDS.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: b.color }}
            />
            {b.label}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Donut({ value }) {
  const r = 26
  const c = 2 * Math.PI * r
  const filled = value == null ? 0 : (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 36 36)"
      />
    </svg>
  )
}
