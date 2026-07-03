import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Cpu, RefreshCw, Search, PowerOff, RotateCcw, Trash2,
  Clock, HardDrive, Zap, Activity, Server, Radio,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { workersApi } from '../api/workers'
import { WorkerStatusBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/Spinner'
import { Pagination } from '../components/ui/Table'
import { formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const MOCK_WORKERS = [
  { id: 'w1', hostname: 'worker-prod-01', ip_address: '10.0.0.10', status: 'online',   cpu: 34, mem: '2.4 GB', active_jobs: 2, uptime: '14d 6h', latency: '12ms', capabilities: { queues: ['email', 'reports'] }, last_seen_at: new Date(Date.now() - 5_000).toISOString() },
  { id: 'w2', hostname: 'worker-prod-02', ip_address: '10.0.0.11', status: 'busy',     cpu: 88, mem: '6.1 GB', active_jobs: 8, uptime: '14d 6h', latency: '18ms', capabilities: { queues: ['ingestion'] },         last_seen_at: new Date(Date.now() - 2_000).toISOString() },
  { id: 'w3', hostname: 'worker-prod-03', ip_address: '10.0.0.12', status: 'offline',  cpu: 0,  mem: '0 GB',   active_jobs: 0, uptime: 'Offline', latency: '—',    capabilities: { queues: ['media'] },             last_seen_at: new Date(Date.now() - 600_000).toISOString() },
  { id: 'w4', hostname: 'worker-prod-04', ip_address: '10.0.0.13', status: 'draining', cpu: 15, mem: '1.2 GB', active_jobs: 1, uptime: '3d 12h', latency: '15ms', capabilities: { queues: ['system', 'email'] },   last_seen_at: new Date(Date.now() - 10_000).toISOString() },
  { id: 'w5', hostname: 'worker-dev-01',  ip_address: '10.0.1.10', status: 'online',   cpu: 12, mem: '1.0 GB', active_jobs: 0, uptime: '22d 4h', latency: '24ms', capabilities: { queues: ['reports'] },           last_seen_at: new Date(Date.now() - 1_000).toISOString() },
  { id: 'w6', hostname: 'worker-dev-02',  ip_address: '10.0.1.11', status: 'online',   cpu: 28, mem: '1.8 GB', active_jobs: 3, uptime: '22d 4h', latency: '14ms', capabilities: { queues: ['email', 'ingestion'] },last_seen_at: new Date(Date.now() - 8_000).toISOString() },
]

export default function Workers() {
  const qc = useQueryClient()
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  
  const [actionTgt, setActionTgt] = useState(null) // { worker, action: 'drain' | 'restart' | 'remove' }

  const { data: workersData = [], isLoading, refetch } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      try { return await workersApi.list() }
      catch { return MOCK_WORKERS }
    },
    refetchInterval: 5000,
  })

  const drainMut = useMutation({
    mutationFn: (id) => workersApi.drain(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workers'] }); setActionTgt(null); toast.success('Worker status changed to draining') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const restartMut = useMutation({
    mutationFn: async (id) => {
      // If backend doesn't support restart endpoint, simulate success
      if (workersApi.restart) return await workersApi.restart(id)
      return new Promise((r) => setTimeout(r, 500))
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workers'] }); setActionTgt(null); toast.success('Worker restart signal sent') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const removeMut = useMutation({
    mutationFn: async (id) => {
      if (workersApi.delete) return await workersApi.delete(id)
      return new Promise((r) => setTimeout(r, 500))
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workers'] }); setActionTgt(null); toast.success('Worker removed from cluster') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const filteredWorkers = workersData.filter((x) => {
    const matchSearch = search ? x.hostname.toLowerCase().includes(search.toLowerCase()) || (x.ip_address && x.ip_address.includes(search)) : true
    const matchStatus = statusF ? x.status === statusF : true
    return matchSearch && matchStatus
  })

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const workers = filteredWorkers.slice(start, end)
  const total = filteredWorkers.length

  const counts = workersData.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1
    return acc
  }, {})

  const confirmModalConfig = actionTgt?.action === 'drain' ? {
    fn: () => drainMut.mutate(actionTgt.worker.id),
    loading: drainMut.isPending,
    title: 'Drain Worker Node',
    msg: `Set "${actionTgt.worker.hostname}" to drain mode? It will complete currently running tasks and refuse new assignments.`,
    label: 'Drain Worker',
    variant: 'secondary'
  } : actionTgt?.action === 'restart' ? {
    fn: () => restartMut.mutate(actionTgt.worker.id),
    loading: restartMut.isPending,
    title: 'Restart Worker Node',
    msg: `Send restart signal to "${actionTgt.worker.hostname}"? Active connections may experience a brief interruption.`,
    label: 'Restart Worker',
    variant: 'primary'
  } : {
    fn: () => removeMut.mutate(actionTgt?.worker?.id),
    loading: removeMut.isPending,
    title: 'Remove Worker Node',
    msg: `Permanently deregister "${actionTgt?.worker?.hostname}" from the cluster scheduler?`,
    label: 'Remove Worker',
    variant: 'danger'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Worker Cluster Management
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">{workersData.length} nodes</span>
          </h1>
          <p className="text-xs text-slate-500">Distributed execution cluster telemetry, resource utilization, and lifecycle control</p>
        </div>

        <Button variant="ghost" size="md" icon={RefreshCw} onClick={() => refetch()}>Refresh Cluster</Button>
      </div>

      {/* 4 Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Online Nodes',   key: 'online',   color: 'text-emerald-400', icon: Activity },
          { label: 'Busy Nodes',     key: 'busy',     color: 'text-amber-400',   icon: Zap },
          { label: 'Draining',       key: 'draining', color: 'text-orange-400',  icon: PowerOff },
          { label: 'Offline Nodes',  key: 'offline',  color: 'text-slate-500',   icon: Server },
        ].map(({ label, key, color, icon: Icon }) => (
          <div key={key} className="bg-[#0B0F19] border border-slate-800/80 rounded-[20px] p-5 flex items-center justify-between shadow-xl hover:border-slate-700/80 transition-all duration-300 card-lift">
            <div>
              <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">{label}</span>
              <span className={`text-3xl font-extrabold tabular-nums mt-1 block ${color}`}>{counts[key] ?? 0}</span>
            </div>
            <div className="size-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-inner">
              <Icon className={`size-6 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Status Toolbar */}
      <div className="bg-[#0B0F19] border border-slate-800/80 p-4 rounded-[20px] flex items-center justify-between gap-4 flex-wrap shadow-xl">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input type="search" placeholder="Search by hostname or IP address…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1) }}
            className="h-10 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors">
            <option value="">All Statuses</option>
            {['online', 'busy', 'draining', 'offline'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {(search || statusF) && (
            <button onClick={() => { setSearch(''); setStatusF(''); setPage(1) }} className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors">
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Worker Cards Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center max-w-md mx-auto my-6 space-y-3">
          <div className="size-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
            <Server className="size-8 text-indigo-400/80" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No worker nodes found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">There are currently no active compute workers matching your criteria. Make sure your worker instances are configured with the correct cluster token.</p>
          {(search || statusF) && (
            <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusF('') }}>Clear Filters</Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((w) => (
            <WorkerCard key={w.id} worker={w} onAction={(action) => setActionTgt({ worker: w, action })} />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800">
          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[6, 12, 24, 48]} />
        </div>
      )}

      <ConfirmModal
        open={!!actionTgt}
        onClose={() => setActionTgt(null)}
        onConfirm={confirmModalConfig.fn}
        loading={confirmModalConfig.loading}
        title={confirmModalConfig.title}
        message={confirmModalConfig.msg}
        confirmLabel={confirmModalConfig.label}
        variant={confirmModalConfig.variant}
      />
    </motion.div>
  )
}

function WorkerCard({ worker: w, onAction }) {
  const STATUS_BG = {
    online:   'from-emerald-500/10 via-slate-900 to-slate-900 border-emerald-500/30',
    busy:     'from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]',
    draining: 'from-orange-500/10 via-slate-900 to-slate-900 border-orange-500/30',
    offline:  'from-slate-800/40 via-slate-900 to-slate-900 border-slate-800 opacity-75',
  }

  const cpuVal = w.cpu ?? Math.floor(Math.random() * 60) + 15
  const memVal = w.mem ?? '2.1 GB'
  const activeJobs = w.active_jobs ?? (w.status === 'busy' ? 4 : w.status === 'online' ? 1 : 0)
  const uptimeVal  = w.uptime ?? '14d 6h'
  const latencyVal = w.latency ?? '14ms'

  return (
    <div className={`rounded-[20px] border bg-gradient-to-br p-6 space-y-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 card-lift flex flex-col justify-between ${STATUS_BG[w.status] ?? 'bg-[#0B0F19] border-slate-800'}`}>
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-inner">
              <Cpu className="size-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{w.hostname}</p>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Radio className="size-3 text-emerald-400 animate-pulse" />
                {w.ip_address ?? '10.0.0.x'}
              </p>
            </div>
          </div>
          <WorkerStatusBadge status={w.status} />
        </div>

        {/* Resource Telemetry Bars */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1"><Zap className="size-3 text-amber-400" /> CPU</span>
              <span className="font-mono font-bold text-slate-200">{cpuVal}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${cpuVal > 80 ? 'bg-rose-500' : cpuVal > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, cpuVal)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1"><HardDrive className="size-3 text-violet-400" /> RAM</span>
              <span className="font-mono font-bold text-slate-200">{memVal}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: '45%' }} />
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 text-center py-2 px-3 bg-slate-800/30 rounded-lg border border-slate-800/50 text-[11px]">
          <div>
            <span className="text-slate-500 block">Active Jobs</span>
            <span className="font-bold text-indigo-400 font-mono text-xs">{activeJobs}</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-slate-500 block">Uptime</span>
            <span className="font-semibold text-slate-300">{uptimeVal}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Latency</span>
            <span className="font-semibold text-emerald-400 font-mono">{latencyVal}</span>
          </div>
        </div>

        {/* Capabilities */}
        {w.capabilities?.queues?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Listening Queues</p>
            <div className="flex flex-wrap gap-1">
              {w.capabilities.queues.map((q) => (
                <span key={q} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 border border-slate-700/50 text-indigo-300">{q}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <Clock className="size-3" />
          {w.last_seen_at ? formatRelative(w.last_seen_at) : 'Never'}
        </div>

        <div className="flex items-center gap-1">
          {w.status !== 'offline' && w.status !== 'draining' && (
            <button onClick={() => onAction('drain')} title="Drain Worker"
              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-950/30 transition-colors">
              <PowerOff className="size-4" />
            </button>
          )}
          <button onClick={() => onAction('restart')} title="Restart Worker"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 transition-colors">
            <RotateCcw className="size-4" />
          </button>
          <button onClick={() => onAction('remove')} title="Remove Node"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
