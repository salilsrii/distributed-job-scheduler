export function Card({ children, className = '', glass = false }) {
  return (
    <div
      className={[
        'rounded-[20px] border shadow-xl shadow-black/20 transition-all duration-300',
        glass
          ? 'bg-[#0B0F19]/60 backdrop-blur-md border-slate-800/80 shadow-2xl'
          : 'bg-[#0B0F19] border-slate-800/80',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-7 py-5 border-b border-slate-800/80 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-extrabold tracking-tight text-slate-100 ${className}`}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-7 py-5 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-7 py-5 border-t border-slate-800/80 ${className}`}>
      {children}
    </div>
  )
}

// Dashboard Stat Card
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  loading = false,
}) {
  const COLORS = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      glow: 'from-indigo-500/20 to-indigo-500/0',
      shadow: 'shadow-indigo-500/10',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'from-emerald-500/20 to-emerald-500/0',
      shadow: 'shadow-emerald-500/10',
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      glow: 'from-green-500/20 to-green-500/0',
      shadow: 'shadow-green-500/10',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      glow: 'from-rose-500/20 to-rose-500/0',
      shadow: 'shadow-rose-500/10',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      glow: 'from-red-500/20 to-red-500/0',
      shadow: 'shadow-red-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      glow: 'from-amber-500/20 to-amber-500/0',
      shadow: 'shadow-amber-500/10',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      glow: 'from-yellow-500/20 to-yellow-500/0',
      shadow: 'shadow-yellow-500/10',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      glow: 'from-blue-500/20 to-blue-500/0',
      shadow: 'shadow-blue-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      glow: 'from-cyan-500/20 to-cyan-500/0',
      shadow: 'shadow-cyan-500/10',
    },
    violet: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      glow: 'from-violet-500/20 to-violet-500/0',
      shadow: 'shadow-violet-500/10',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      glow: 'from-purple-500/20 to-purple-500/0',
      shadow: 'shadow-purple-500/10',
    },
    slate: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
      glow: 'from-slate-500/20 to-slate-500/0',
      shadow: 'shadow-slate-500/10',
    },
  }

  // Prevent crashes if an unknown color is passed
  const c = COLORS[color] ?? COLORS.indigo

  return (
    <div
      className={`rounded-[20px] border bg-[#0B0F19] p-7 ${c.border} relative overflow-hidden group card-hover-lift h-full flex flex-col justify-between shadow-xl ${c.shadow}`}
    >
      {/* Ambient background glow orb */}
      <div
        className={`absolute -top-12 -right-12 size-36 rounded-full bg-gradient-to-br ${c.glow} blur-2xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>

          {Icon && (
            <div className={`p-3 rounded-2xl ${c.bg} shadow-sm border border-white/5 group-hover:scale-110 transition-transform duration-200`}>
              <Icon className={`size-5 ${c.text}`} />
            </div>
          )}
        </div>

        <div>
          {loading ? (
            <div className="animate-pulse h-10 w-28 rounded-xl bg-slate-800 my-1" />
          ) : (
            <p className="text-4xl font-extrabold text-white tabular-nums tracking-tight my-1 drop-shadow-sm">
              {value}
            </p>
          )}

          {subtitle && (
            <p className="mt-1.5 text-[11px] font-medium text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          )}

          {trend !== undefined && trend !== null && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  trend >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}