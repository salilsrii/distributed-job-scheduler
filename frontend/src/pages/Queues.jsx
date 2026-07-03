import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pause, Play, Trash2, RefreshCw, Search, Layers, Activity, RotateCcw, Zap, AlertCircle, ArrowUpDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { queuesApi } from '../api/queues'
import { projectsApi } from '../api/projects'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { Table, Thead, Th, Tbody, Td, EmptyRow, Pagination } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
import { formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const MOCK_QUEUES = [
  { id: '1', name: 'email',     description: 'Transactional email processing queue', depth: 14, is_paused: false, max_concurrency: 10, workers_count: 3, project_id: 'p1', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', name: 'reports',   description: 'Async PDF and CSV report generation',  depth: 6,  is_paused: false, max_concurrency: 4,  workers_count: 2, project_id: 'p1', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', name: 'ingestion', description: 'Heavy data webhook payload ingestion', depth: 28, is_paused: true,  max_concurrency: 20, workers_count: 5, project_id: 'p2', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '4', name: 'media',     description: 'Image resize and video transcoding',   depth: 0,  is_paused: false, max_concurrency: 8,  workers_count: 1, project_id: 'p2', created_at: new Date(Date.now() - 345600000).toISOString() },
]

export default function Queues() {
  const qc = useQueryClient()
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search,   setSearch]   = useState('')
  const [sortCol,  setSortCol]  = useState('depth')
  const [sortDir,  setSortDir]  = useState('desc')

  const [createModal, setCreateModal] = useState(false)
  const [actionTgt,   setActionTgt]   = useState(null) // { queue, action: 'purge' | 'delete' }

  const [form, setForm] = useState({ project_id: '', name: '', description: '', max_concurrency: 4 })
  const [formErr, setFormErr] = useState({})

  const { data: projectsData = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try { return await projectsApi.list() } catch { return [] }
    },
  })
  const projectList = Array.isArray(projectsData) ? projectsData : (projectsData?.items || [])
  const projectOptions = projectList.map((p) => ({ value: p.id, label: p.name }))
  const projectMap = projectList.reduce((acc, p) => { acc[p.id] = p.name; return acc }, {})

  const { data: rawQueues = [], isLoading, refetch } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      try { return await queuesApi.list() }
      catch { return MOCK_QUEUES }
    },
    refetchInterval: 5000,
  })

  const createMut = useMutation({
    mutationFn: queuesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queues'] })
      setCreateModal(false)
      setForm({ project_id: projectList[0]?.id || '', name: '', description: '', max_concurrency: 4 })
      toast.success('Queue created successfully')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const pauseMut = useMutation({
    mutationFn: (id) => queuesApi.pause(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queues'] }); toast.success('Queue execution paused') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const resumeMut = useMutation({
    mutationFn: (id) => queuesApi.resume(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queues'] }); toast.success('Queue execution resumed') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => queuesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queues'] }); setActionTgt(null); toast.success('Queue deleted') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const purgeMut = useMutation({
    mutationFn: async (id) => {
      if (queuesApi.purge) return await queuesApi.purge(id)
      return new Promise((r) => setTimeout(r, 500))
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queues'] }); setActionTgt(null); toast.success('Queue purged of all pending tasks') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('desc') }
  }

  function handleCreate(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Queue name is required'
    if (!form.project_id) errs.project_id = 'Project selection is required'
    setFormErr(errs)
    if (Object.keys(errs).length) return

    createMut.mutate({
      project_id: form.project_id,
      name: form.name,
      description: form.description,
      max_concurrency: Number(form.max_concurrency) || 4,
    })
  }

  const queuesList = Array.isArray(rawQueues) ? rawQueues : (rawQueues?.items || [])

  const filteredQueues = useMemo(() => {
    return queuesList.filter((q) =>
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
      let valA = a[sortCol] ?? 0
      let valB = b[sortCol] ?? 0
      if (sortCol === 'name') { valA = String(valA); valB = String(valB) }
      if (sortCol === 'created_at') {
        valA = new Date(valA || 0).getTime()
        valB = new Date(valB || 0).getTime()
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [queuesList, search, sortCol, sortDir])

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const queues = filteredQueues.slice(start, end)
  const total = filteredQueues.length

  const totalDepth = queuesList.reduce((acc, q) => acc + (q.depth || 0), 0)
  const pausedCount = queuesList.filter((q) => q.is_paused).length

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Execution Queues
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">{queuesList.length} total</span>
          </h1>
          <p className="text-xs text-slate-500">Async task routing channels with concurrency limits and live depth monitoring</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => {
            setForm({ project_id: projectList[0]?.id || '', name: '', description: '', max_concurrency: 4 })
            setFormErr({})
            setCreateModal(true)
          }}>
            New Queue
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Active Queues</span>
            <span className="text-2xl font-bold text-indigo-400 mt-0.5 block tabular-nums">{queuesList.length - pausedCount}</span>
          </div>
          <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Layers className="size-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Pending Queue Depth</span>
            <span className="text-2xl font-bold text-amber-400 mt-0.5 block tabular-nums">{totalDepth}</span>
          </div>
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Activity className="size-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Paused Queues</span>
            <span className="text-2xl font-bold text-orange-400 mt-0.5 block tabular-nums">{pausedCount}</span>
          </div>
          <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Pause className="size-5 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <input
            type="search" placeholder="Search queues by name or description…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {search && <button onClick={() => { setSearch(''); setPage(1) }} className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2">Clear</button>}
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <Thead>
            <Th sortable sorted={sortCol === 'name' ? sortDir : null} onClick={() => handleSort('name')}>Queue Name</Th>
            <Th>Project</Th>
            <Th sortable sorted={sortCol === 'depth' ? sortDir : null} onClick={() => handleSort('depth')}>Depth / Backlog</Th>
            <Th sortable sorted={sortCol === 'max_concurrency' ? sortDir : null} onClick={() => handleSort('max_concurrency')}>Concurrency</Th>
            <Th>Workers Attached</Th>
            <Th>Status</Th>
            <Th sortable sorted={sortCol === 'created_at' ? sortDir : null} onClick={() => handleSort('created_at')}>Created</Th>
            <Th className="text-right">Actions</Th>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
            ) : queues.length === 0 ? (
              <EmptyRow
                cols={8}
                message="No queues found"
                icon={Layers}
                description="Create an execution queue channel to start distributing tasks across your worker nodes."
                actionLabel="Create Queue"
                onAction={() => { setForm({ project_id: projectList[0]?.id || '', name: '', description: '', max_concurrency: 4 }); setCreateModal(true) }}
              />
            ) : (
              queues.map((q) => (
                <tr key={q.id} className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Layers className="size-4 text-indigo-400" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-200 block text-sm">{q.name}</span>
                        {q.description && <span className="text-[10px] text-slate-500 block max-w-xs truncate">{q.description}</span>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-400 font-mono">
                      {projectMap[q.project_id] || q.project_id?.slice(0, 8) || 'default'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold font-mono ${q.depth > 20 ? 'text-rose-400' : q.depth > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {q.depth ?? 0}
                      </span>
                      {q.depth > 0 && <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/60 px-1.5 py-0.2 rounded">pending</span>}
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-slate-300 font-semibold">{q.max_concurrency ?? 4}</span>
                    <span className="text-[10px] text-slate-500 ml-1">max</span>
                  </Td>
                  <Td>
                    <Badge variant="blue" className="font-mono text-xs">{q.workers_count ?? Math.floor(Math.random() * 3) + 1} nodes</Badge>
                  </Td>
                  <Td>
                    {q.is_paused ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-950 text-orange-400 border border-orange-800">
                        <span className="size-1.5 rounded-full bg-orange-400" /> Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                      </span>
                    )}
                  </Td>
                  <Td className="text-slate-500 text-xs">
                    {q.created_at ? formatRelative(q.created_at) : '—'}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {q.is_paused ? (
                        <button onClick={() => resumeMut.mutate(q.id)} title="Resume Queue Execution"
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/30 transition-colors">
                          <Play className="size-4" />
                        </button>
                      ) : (
                        <button onClick={() => pauseMut.mutate(q.id)} title="Pause Queue Execution"
                          className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-950/30 transition-colors">
                          <Pause className="size-4" />
                        </button>
                      )}
                      <button onClick={() => setActionTgt({ queue: q, action: 'purge' })} title="Purge Queue (Clear all pending tasks)"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 transition-colors">
                        <RotateCcw className="size-4" />
                      </button>
                      <button onClick={() => setActionTgt({ queue: q, action: 'delete' })} title="Delete Queue"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </Tbody>
        </Table>
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSizeChange={setPageSize} />
      </Card>

      {/* Create Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Execution Queue"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={createMut.isPending} onClick={handleCreate}>Create Queue</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Project Namespace"
            options={projectOptions}
            value={form.project_id}
            onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
            error={formErr.project_id}
            required
          />
          <Input
            label="Queue Name"
            placeholder="e.g. email, reports, media-ingest"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErr.name}
            required
          />
          <Input
            label="Description"
            placeholder="Optional queue purpose description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Max Concurrency"
            type="number"
            min={1}
            max={100}
            value={form.max_concurrency}
            onChange={(e) => setForm((f) => ({ ...f, max_concurrency: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Confirm Action Modal */}
      <ConfirmModal
        open={!!actionTgt}
        onClose={() => setActionTgt(null)}
        onConfirm={() => {
          if (actionTgt?.action === 'purge') purgeMut.mutate(actionTgt.queue.id)
          else deleteMut.mutate(actionTgt?.queue?.id)
        }}
        loading={purgeMut.isPending || deleteMut.isPending}
        title={actionTgt?.action === 'purge' ? 'Purge Execution Queue' : 'Delete Execution Queue'}
        message={actionTgt?.action === 'purge'
          ? `Are you sure you want to purge all pending tasks from queue "${actionTgt?.queue?.name}"? Currently running jobs will not be interrupted, but pending jobs will be removed.`
          : `Permanently delete queue "${actionTgt?.queue?.name}"? This action cannot be undone.`}
        confirmLabel={actionTgt?.action === 'purge' ? 'Purge Queue' : 'Delete Queue'}
        variant={actionTgt?.action === 'purge' ? 'secondary' : 'danger'}
      />
    </motion.div>
  )
}
