import { JOB_STATUS_CONFIG, WORKER_STATUS_CONFIG } from '../../utils/constants'

function StatusDot({ pulse, color }) {
  return (
    <span className="relative flex size-2">
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full size-2 ${color}`} />
    </span>
  )
}

export function JobStatusBadge({ status }) {
  const cfg = JOB_STATUS_CONFIG[status] ?? { label: status, color: 'text-slate-400', bg: 'bg-slate-800', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <StatusDot pulse={cfg.pulse} color={cfg.dot} />
      {cfg.label}
    </span>
  )
}

export function WorkerStatusBadge({ status }) {
  const cfg = WORKER_STATUS_CONFIG[status] ?? { label: status, color: 'text-slate-400', bg: 'bg-slate-800', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <StatusDot pulse={cfg.pulse} color={cfg.dot} />
      {cfg.label}
    </span>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const VARIANTS = {
    default: 'bg-slate-800 text-slate-300',
    blue:    'bg-blue-950 text-blue-400',
    green:   'bg-emerald-950 text-emerald-400',
    red:     'bg-rose-950 text-rose-400',
    amber:   'bg-amber-950 text-amber-400',
    violet:  'bg-violet-950 text-violet-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
