import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cpu, RefreshCw, Search, PowerOff, Activity, Clock } from 'lucide-react'
import { workersApi } from '../api/workers'
import { WorkerStatusBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/Spinner'
import { formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const MOCK_WORKERS = [
  { id: 'w1', hostname: 'worker-prod-01', ip_address: '10.0.0.10', status: 'online',   capabilities: { queues: ['email', 'reports'] }, last_seen_at: new Date(Date.now() - 5_000).toISOString() },
  { id: 'w2', hostname: 'worker-prod-02', ip_address: '10.0.0.11', status: 'busy',     capabilities: { queues: ['ingestion'] },         last_seen_at: new Date(Date.now() - 2_000).toISOString() },
  { id: 'w3', hostname: 'worker-prod-03', ip_address: '10.0.0.12', status: 'offline',  capabilities: { queues: ['media'] },             last_seen_at: new Date(Date.now() - 600_000).toISOString() },
  { id: 'w4', hostname: 'worker-prod-04', ip_address: '10.0.0.13', status: 'draining', capabilities: { queues: ['system', 'email'] },   last_seen_at: new Date(Date.now() - 10_000).toISOString() },
  { id: 'w5', hostname: 'worker-dev-01',  ip_address: '10.0.1.10', status: 'online',   capabilities: { queues: ['reports'] },           last_seen_at: new Date(Date.now() - 1_000).toISOString() },
  { id: 'w6', hostname: 'worker-dev-02',  ip_address: '10.0.1.11', status: 'online',   capabilities: { queues: ['email', 'ingestion'] },last_seen_at: new Date(Date.now() - 8_000).toISOString() },
]

export default function Workers() {
  const qc = useQueryClient()
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')
  const [drainTgt,setDrainTgt]= useState(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workers', search, statusF],
    queryFn: async () => {
      try { return await workersApi.list({ search, status: statusF || undefined }) }
      catch {
        let w = MOCK_WORKERS
        if (search) w = w.filter((x) => x.hostname.includes(search))
        if (statusF) w = w.filter((x) => x.status === statusF)
        return { items: w, total: w.length }
      }
    },
    refetchInterval: 15_000,
  })

  const drainMut = useMutation({
    mutationFn: workersApi.drain,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workers'] }); setDrainTgt(null); toast.success('Worker set to draining') },
    onError: (e) => toast.error(e.message),
  })

  const workers = data?.items ?? []

  const counts = workers.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Online',   key: 'online',   color: 'text-emerald-400' },
          { label: 'Busy',     key: 'busy',     color: 'text-amber-400' },
          { label: 'Draining', key: 'draining', color: 'text-orange-400' },
          { label: 'Offline',  key: 'offline',  color: 'text-slate-500' },
        ].map(({ label, key, color }) => (
          <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`text-2xl font-bold tabular-nums ${color}`}>{counts[key] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input type="search" placeholder="Search hostname…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">All statuses</option>
            {['online', 'busy', 'draining', 'offline'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Worker cards grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-600">
          <Cpu className="size-10" />
          <p className="text-sm">No workers found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => (
            <WorkerCard key={w.id} worker={w} onDrain={() => setDrainTgt(w)} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!drainTgt}
        onClose={() => setDrainTgt(null)}
        onConfirm={() => drainMut.mutate(drainTgt?.id)}
        loading={drainMut.isPending}
        title="Drain Worker"
        message={`Set "${drainTgt?.hostname}" to draining? It will finish current jobs and stop accepting new ones.`}
        confirmLabel="Drain"
        variant="secondary"
      />
    </div>
  )
}

function WorkerCard({ worker: w, onDrain }) {
  const STATUS_BG = {
    online:   'from-emerald-500/5 to-transparent border-emerald-500/20',
    busy:     'from-amber-500/5 to-transparent border-amber-500/20',
    draining: 'from-orange-500/5 to-transparent border-orange-500/20',
    offline:  'from-slate-700/10 to-transparent border-slate-700/30',
  }

  return (
    <div className={`rounded-xl border bg-gradient-to-br bg-slate-900 p-5 space-y-4 hover:shadow-lg transition-all duration-200 ${STATUS_BG[w.status] ?? 'border-slate-800'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <Cpu className="size-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{w.hostname}</p>
            <p className="text-xs text-slate-600 font-mono">{w.ip_address ?? '—'}</p>
          </div>
        </div>
        <WorkerStatusBadge status={w.status} />
      </div>

      {/* Capabilities */}
      {w.capabilities?.queues?.length > 0 && (
        <div>
          <p className="text-xs text-slate-600 mb-1.5">Queues</p>
          <div className="flex flex-wrap gap-1">
            {w.capabilities.queues.map((q) => (
              <span key={q} className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">{q}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="size-3" />
          {w.last_seen_at ? formatRelative(w.last_seen_at) : 'Never'}
        </div>
        {w.status !== 'offline' && w.status !== 'draining' && (
          <button onClick={onDrain}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-orange-400 hover:bg-orange-950/30 transition-colors">
            <PowerOff className="size-3" /> Drain
          </button>
        )}
      </div>
    </div>
  )
}
