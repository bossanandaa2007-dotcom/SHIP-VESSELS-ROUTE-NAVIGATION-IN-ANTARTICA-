export default function Card({
  title,
  icon: Icon,
  live,
  badge,
  action,
  children,
  className = '',
}) {
  return (
    <div
      className={`bg-[#0e1729] border border-[#1e293b] rounded-xl p-4 ${className}`}
    >
      {(title || action || badge) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon size={17} className="text-sky-400 shrink-0" />}
            {title && (
              <h3 className="font-semibold text-slate-100 text-sm truncate">{title}</h3>
            )}
            {badge}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {live && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
            {action}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

export function MockBadge() {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
      Mock
    </span>
  )
}
