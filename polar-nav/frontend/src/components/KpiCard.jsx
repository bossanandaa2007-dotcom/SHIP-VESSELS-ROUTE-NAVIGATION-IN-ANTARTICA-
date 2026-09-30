import { MockBadge } from './Card'

export default function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  subClass = 'text-slate-500',
  mock,
}) {
  return (
    <div className="bg-[#0e1729] border border-[#1e293b] rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-slate-400">
          {Icon && <Icon size={15} className="text-sky-400" />}
          {label}
        </span>
        {mock && <MockBadge />}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      {sub && <div className={`text-[11px] mt-0.5 ${subClass}`}>{sub}</div>}
    </div>
  )
}
