// ── Route Paths ────────────────────────────────────────────
export const ROUTES = {
  LOGIN:      '/login',
  DASHBOARD:  '/',
  PROJECTS:   '/projects',
  QUEUES:     '/queues',
  JOBS:       '/jobs',
  JOB_CREATE: '/jobs/new',
  JOB_DETAIL: '/jobs/:id',
  WORKERS:    '/workers',
  SETTINGS:   '/settings',
}

// ── Job Status ─────────────────────────────────────────────
export const JOB_STATUS = {
  PENDING:   'pending',
  QUEUED:    'queued',
  RUNNING:   'running',
  SUCCESS:   'success',
  FAILED:    'failed',
  CANCELLED: 'cancelled',
  RETRYING:  'retrying',
}

export const JOB_STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-slate-400',   bg: 'bg-slate-800',   dot: 'bg-slate-400' },
  queued:    { label: 'Queued',    color: 'text-amber-400',   bg: 'bg-amber-950',   dot: 'bg-amber-400' },
  running:   { label: 'Running',   color: 'text-blue-400',    bg: 'bg-blue-950',    dot: 'bg-blue-400',  pulse: true },
  success:   { label: 'Success',   color: 'text-emerald-400', bg: 'bg-emerald-950', dot: 'bg-emerald-400' },
  failed:    { label: 'Failed',    color: 'text-rose-400',    bg: 'bg-rose-950',    dot: 'bg-rose-400' },
  cancelled: { label: 'Cancelled', color: 'text-slate-500',   bg: 'bg-slate-900',   dot: 'bg-slate-500' },
  retrying:  { label: 'Retrying',  color: 'text-violet-400',  bg: 'bg-violet-950',  dot: 'bg-violet-400', pulse: true },
}

// ── Worker Status ──────────────────────────────────────────
export const WORKER_STATUS = {
  ONLINE:   'online',
  OFFLINE:  'offline',
  BUSY:     'busy',
  DRAINING: 'draining',
}

export const WORKER_STATUS_CONFIG = {
  online:   { label: 'Online',   color: 'text-emerald-400', bg: 'bg-emerald-950', dot: 'bg-emerald-400', pulse: true },
  offline:  { label: 'Offline',  color: 'text-slate-500',   bg: 'bg-slate-900',   dot: 'bg-slate-500' },
  busy:     { label: 'Busy',     color: 'text-amber-400',   bg: 'bg-amber-950',   dot: 'bg-amber-400',  pulse: true },
  draining: { label: 'Draining', color: 'text-orange-400',  bg: 'bg-orange-950',  dot: 'bg-orange-400' },
}

// ── Pagination ─────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20

// ── Priority Labels ────────────────────────────────────────
export const PRIORITY_LABELS = {
  0:   { label: 'Normal',   color: 'text-slate-400' },
  5:   { label: 'Medium',   color: 'text-amber-400' },
  10:  { label: 'High',     color: 'text-orange-400' },
  100: { label: 'Critical', color: 'text-rose-400' },
}

// ── Backoff Strategies ─────────────────────────────────────
export const BACKOFF_STRATEGIES = ['fixed', 'linear', 'exponential']
