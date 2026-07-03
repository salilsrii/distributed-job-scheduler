export function Card({ children, className = '', glass = false }) {
  return (
    <div
      className={[
        'rounded-xl border',
        glass
          ? 'bg-slate-900/60 backdrop-blur-md border-slate-700/50'
          : 'bg-slate-900 border-slate-800',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-800 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-slate-100 ${className}`}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-800 ${className}`}>
      {children}
    </div>
  )
}

// Stat card for dashboard
export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo', loading = false }) {
  const COLORS = {
    indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  }
  const c = COLORS[color]

  return (
    <div className={`rounded-xl border bg-slate-900 p-6 ${c.border} relative overflow-hidden group hover:border-opacity-60 transition-all duration-200`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          {Icon && (
            <div className={`p-2 rounded-lg ${c.bg}`}>
              <Icon className={`size-4 ${c.text}`} />
            </div>
          )}
        </div>
        {loading ? (
          <div className="skeleton h-8 w-24 mb-2" />
        ) : (
          <p className="text-3xl font-bold text-slate-100 tabular-nums">{value}</p>
        )}
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        {trend != null && (
          <p className={`mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last hour
          </p>
        )}
      </div>
    </div>
  )
}
