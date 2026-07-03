import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus, RefreshCw, Search, RotateCcw, XCircle, Filter, Eye,
  Trash2, Calendar, Layers, Activity, Briefcase, ArrowUpDown,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { jobsApi } from '../api/jobs'
import { queuesApi } from '../api/queues'
import { projectsApi } from '../api/projects'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { JobStatusBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { Table, Thead, Th, Tbody, Td, EmptyRow, Pagination } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
import { JobDetailDrawer } from '../components/ui/JobDetailDrawer'
import { formatRelative, formatDuration, priorityLabel } from '../utils/formatters'
import { ROUTES, JOB_STATUS } from '../utils/constants'
import { toast } from '../hooks/useToast'

const STATUSES = ['', ...Object.values(JOB_STATUS)]
const MOCK_JOBS = Array.from({ length: 18 }, (_, i) => ({
  id: String(i + 1),
  name: ['email-digest', 'report-gen', 'data-import', 'cleanup', 'thumbnail-gen', 'notification-push'][i % 6],
  status: STATUSES[((i * 3) % 7) + 1] || 'pending',
  priority: [0, 0, 5, 10, 0, 100][i % 6],
  queue: { name: ['email', 'reports', 'ingestion', 'system', 'media'][i % 5] },
  timeout_seconds: [60, 120, 300, 600, 900][i % 5],
  created_at: new Date(Date.now() - i * 3600_000).toISOString(),
  max_retries: 3,
}))

export default function Jobs() {
  const qc = useQueryClient()
  const [page,      setPage]      = useState(1)
  const [pageSize,  setPageSize]  = useState(10)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('')
  const [priorityF, setPriorityF] = useState('')
  const [queueF,    setQueueF]    = useState('')
  const [dateF,     setDateF]     = useState('')
  const [sortCol,   setSortCol]   = useState('created_at')
  const [sortDir,   setSortDir]   = useState('desc')

  const [actionTgt, setActionTgt] = useState(null) // { job, action }
  const [selectedJob, setSelectedJob] = useState(null) // for Drawer

  const { data: jobsData = [], isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        return await jobsApi.list()
      } catch {
        return MOCK_JOBS
      }
    },
    refetchInterval: 5000,
  })

  const { data: queuesData = [] } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      try { return await queuesApi.list() } catch { return [] }
    },
    staleTime: 60_000,
  })
  const queueList = Array.isArray(queuesData) ? queuesData : (queuesData?.items || [])

  const queueMap = queueList.reduce((acc, q) => {
    acc[q.id] = q.name
    return acc
  }, {})

  const cancelMut = useMutation({
    mutationFn: (id) => jobsApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); setActionTgt(null); toast.success('Job cancelled') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })
  const retryMut = useMutation({
    mutationFn: (id) => jobsApi.retry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); setActionTgt(null); toast.success('Job re-queued') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => jobsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); setActionTgt(null); toast.success('Job deleted') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const filteredJobs = useMemo(() => {
    return jobsData.filter((job) => {
      const matchSearch   = search    ? job.name.toLowerCase().includes(search.toLowerCase()) || job.id.includes(search) : true
      const matchStatus   = status    ? job.status === status : true
      const matchPriority = priorityF !== '' ? String(job.priority || 0) === priorityF : true
      const matchQueue    = queueF    ? (job.queue_id === queueF || job.queue?.name === queueF) : true
      
      let matchDate = true
      if (dateF === '1h') matchDate = new Date(job.created_at) >= new Date(Date.now() - 3600_000)
      if (dateF === '24h') matchDate = new Date(job.created_at) >= new Date(Date.now() - 86400_000)
      if (dateF === '7d') matchDate = new Date(job.created_at) >= new Date(Date.now() - 604800_000)

      return matchSearch && matchStatus && matchPriority && matchQueue && matchDate
    }).sort((a, b) => {
      let valA = a[sortCol]
      let valB = b[sortCol]
      if (sortCol === 'created_at') {
        valA = new Date(valA || 0).getTime()
        valB = new Date(valB || 0).getTime()
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [jobsData, search, status, priorityF, queueF, dateF, sortCol, sortDir])

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const jobs = filteredJobs.slice(start, end)
  const total = filteredJobs.length

  const confirmAction = actionTgt?.action === 'cancel'
    ? { fn: () => cancelMut.mutate(actionTgt.job.id), loading: cancelMut.isPending, label: 'Cancel Job', msg: `Cancel job "${actionTgt?.job?.name}"?` }
    : actionTgt?.action === 'delete'
    ? { fn: () => deleteMut.mutate(actionTgt.job.id), loading: deleteMut.isPending, label: 'Delete Job', msg: `Permanently delete job "${actionTgt?.job?.name}"?` }
    : { fn: () => retryMut.mutate(actionTgt?.job?.id), loading: retryMut.isPending, label: 'Retry Job', msg: `Re-queue job "${actionTgt?.job?.name}"?` }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header & Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Job Explorer
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">{jobsData.length} total</span>
          </h1>
          <p className="text-xs text-slate-500">Real-time job execution telemetry and management</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
          <Link to={ROUTES.JOB_CREATE}>
            <Button variant="primary" size="md" icon={Plus}>Create Job</Button>
          </Link>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-[#0B0F19] border border-slate-800/80 p-4 rounded-[20px] flex flex-wrap items-center gap-3 shadow-xl">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <input
            type="search" placeholder="Search by name or ID…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        <select
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="">All Statuses</option>
          {Object.values(JOB_STATUS).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={queueF} onChange={(e) => { setQueueF(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="">All Queues</option>
          {queueList.map((q) => (
            <option key={q.id} value={q.id}>{q.name}</option>
          ))}
        </select>

        <select
          value={priorityF} onChange={(e) => { setPriorityF(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="">All Priorities</option>
          <option value="0">Normal (0)</option>
          <option value="5">Medium (5)</option>
          <option value="10">High (10)</option>
          <option value="100">Critical (100)</option>
        </select>

        <select
          value={dateF} onChange={(e) => { setDateF(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="">All Time</option>
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>

        {(search || status || priorityF || queueF || dateF) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setPriorityF(''); setQueueF(''); setDateF(''); setPage(1) }}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Jobs Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <Thead>
            <Th sortable sorted={sortCol === 'name' ? sortDir : null} onClick={() => handleSort('name')}>Name</Th>
            <Th>Queue</Th>
            <Th sortable sorted={sortCol === 'status' ? sortDir : null} onClick={() => handleSort('status')}>Status</Th>
            <Th sortable sorted={sortCol === 'priority' ? sortDir : null} onClick={() => handleSort('priority')}>Priority</Th>
            <Th>Timeout</Th>
            <Th sortable sorted={sortCol === 'created_at' ? sortDir : null} onClick={() => handleSort('created_at')}>Created</Th>
            <Th className="text-right">Actions</Th>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : jobs.length === 0
              ? <EmptyRow cols={7} message="No jobs match your filters" icon={Briefcase} description="Try clearing your status or priority filters to see more results." />
              : jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors group">
                  <Td>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-left flex items-center gap-1.5"
                    >
                      {job.name}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 text-[10px]">↗ details</span>
                    </button>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {job.id.slice(0, 8)}</div>
                  </Td>
                  <Td>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/60">
                      {job.queue?.name ?? queueMap[job.queue_id] ?? job.queue_id?.slice(0, 8) ?? 'default'}
                    </span>
                  </Td>
                  <Td><JobStatusBadge status={job.status} /></Td>
                  <Td>
                    <span className={`text-xs font-bold ${
                      job.priority >= 100 ? 'text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800' :
                      job.priority >= 10  ? 'text-orange-400' :
                      job.priority >= 5   ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {priorityLabel(job.priority)}
                    </span>
                  </Td>
                  <Td className="text-slate-400 text-xs font-mono">{formatDuration(job.timeout_seconds)}</Td>
                  <Td className="text-slate-400 text-xs">{job.created_at ? formatRelative(job.created_at) : '—'}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-1.5 rounded text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 transition-colors"
                        title="View Details Drawer"
                      >
                        <Eye className="size-4" />
                      </button>
                      {['running', 'queued', 'pending', 'retrying'].includes(job.status) && (
                        <button onClick={() => setActionTgt({ job, action: 'cancel' })}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors" title="Cancel">
                          <XCircle className="size-4" />
                        </button>
                      )}
                      {['failed', 'cancelled'].includes(job.status) && (
                        <button onClick={() => setActionTgt({ job, action: 'retry' })}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 transition-colors" title="Retry">
                          <RotateCcw className="size-4" />
                        </button>
                      )}
                      <button onClick={() => setActionTgt({ job, action: 'delete' })}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors" title="Delete">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            }
          </Tbody>
        </Table>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onRetry={(id) => { retryMut.mutate(id); setSelectedJob(null) }}
        onCancel={(id) => { cancelMut.mutate(id); setSelectedJob(null) }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!actionTgt}
        onClose={() => setActionTgt(null)}
        onConfirm={confirmAction.fn}
        loading={confirmAction.loading}
        title={confirmAction.label}
        message={confirmAction.msg}
        confirmLabel={confirmAction.label}
        variant={actionTgt?.action === 'cancel' || actionTgt?.action === 'delete' ? 'danger' : 'primary'}
      />
    </motion.div>
  )
}
