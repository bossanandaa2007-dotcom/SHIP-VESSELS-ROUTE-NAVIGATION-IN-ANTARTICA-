import { useEffect, useState } from 'react'
import { Calendar, ChevronDown, User } from 'lucide-react'
import { fmtClockUTC } from '../lib/format'

export default function TopBar() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-[#1e293b] bg-[#0b1322]">
      <div>
        <h1 className="text-lg font-bold text-white leading-tight">
          Polar Navigation Intelligence
        </h1>
        <p className="text-[11px] text-sky-400/80">
          Safer Routes · Smarter Decisions · Sustainable Oceans
        </p>
      </div>

      <div className="flex items-center gap-5 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar size={15} className="text-slate-500" />
          <span className="tabular-nums">{fmtClockUTC(now)}</span>
        </div>

        <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>

        <div className="flex items-center gap-2 pl-4 border-l border-[#1e293b]">
          <span className="w-7 h-7 rounded-full bg-slate-700 grid place-items-center">
            <User size={16} />
          </span>
          <span className="text-slate-200">Fleet Operator</span>
          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </header>
  )
}
