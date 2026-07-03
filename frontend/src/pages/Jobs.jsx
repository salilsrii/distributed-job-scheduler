import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus, RefreshCw, Search, RotateCcw, XCircle, Filter, ChevronDown,
} from 'lucide-react'
import { jobsApi } from '../api/jobs'
import { queuesApi } from '../api/queues'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { JobStatusBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { Table, Thead, Th, Tbody, Td, EmptyRow, Pagination } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
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

const PAGE_SIZE = 10

export default function Jobs() {
  const qc = useQueryClient()
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('')
  const [actionTgt, setActionTgt] = useState(null) // { job, action }

  const { data: jobsData = [], isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        return await jobsApi.list()
      } catch {
        return MOCK_JOBS
      }
    },
  })

  const { data: queuesData = [] } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      try {
        return await queuesApi.list()
      } catch {
        return []
      }
    },
    staleTime: 60_000,
  })

  const queueMap = queuesData.reduce((acc, q) => {
    acc[q.id] = q.name
    return acc
  }, {})

  const filteredJobs = jobsData.filter((job) => {
    const matchSearch = search ? job.name.toLowerCase().includes(search.toLowerCase()) : true
    const matchStatus = status ? job.status === status : true
    return matchSearch && matchStatus
  })

  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const jobs = filteredJobs.slice(start, end)
  const total = filteredJobs.length

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

  const confirmAction = actionTgt?.action === 'cancel'
    ? { fn: () => cancelMut.mutate(actionTgt.job.id), loading: cancelMut.isPending, label: 'Cancel Job', msg: `Cancel job "${actionTgt?.job?.name}"?` }
    : { fn: () => retryMut.mutate(actionTgt?.job?.id), loading: retryMut.isPending, label: 'Retry Job', msg: `Re-queue job "${actionTgt?.job?.name}"?` }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input
              type="search" placeholder="Search jobs…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All statuses</option>
            {Object.values(JOB_STATUS).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
          <Link to={ROUTES.JOB_CREATE}>
            <Button variant="primary" size="sm" icon={Plus}>Create Job</Button>
          </Link>
        </div>
      </div>

      <Card>
        <Table>
          <Thead>
            <Th>Name</Th>
            <Th>Queue</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Timeout</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : jobs.length === 0
              ? <EmptyRow cols={7} message="No jobs match your filters" />
              : jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                  <Td>
                    <Link to={`/jobs/${job.id}`} className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                      {job.name}
                    </Link>
                  </Td>
                  <Td className="text-slate-400 text-xs font-mono">{job.queue?.name ?? queueMap[job.queue_id] ?? job.queue_id?.slice(0, 8) ?? '—'}</Td>
                  <Td><JobStatusBadge status={job.status} /></Td>
                  <Td>
                    <span className={`text-xs font-medium ${job.priority >= 100 ? 'text-rose-400' : job.priority >= 10 ? 'text-orange-400' : job.priority >= 5 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {priorityLabel(job.priority)}
                    </span>
                  </Td>
                  <Td className="text-slate-500 text-xs">{formatDuration(job.timeout_seconds)}</Td>
                  <Td className="text-slate-500 text-xs">{job.created_at ? formatRelative(job.created_at) : '—'}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      {['running', 'queued', 'pending', 'retrying'].includes(job.status) && (
                        <button onClick={() => setActionTgt({ job, action: 'cancel' })}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors" title="Cancel">
                          <XCircle className="size-4" />
                        </button>
                      )}
                      {['failed', 'cancelled'].includes(job.status) && (
                        <button onClick={() => setActionTgt({ job, action: 'retry' })}
                          className="p-1.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/30 transition-colors" title="Retry">
                          <RotateCcw className="size-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            }
          </Tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </Card>

      <ConfirmModal
        open={!!actionTgt}
        onClose={() => setActionTgt(null)}
        onConfirm={confirmAction.fn}
        loading={confirmAction.loading}
        title={confirmAction.label}
        message={confirmAction.msg}
        confirmLabel={confirmAction.label}
        variant={actionTgt?.action === 'cancel' ? 'danger' : 'primary'}
      />
    </div>
  )
}
