import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, FolderKanban, Search, RefreshCw, Edit2, ArrowUpDown, Activity, Layers, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { projectsApi } from '../api/projects'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { Table, Thead, Th, Tbody, Td, EmptyRow, Pagination } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
import { formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const MOCK_PROJECTS = [
  { id: 'p1', name: 'Data Pipeline Core', description: 'ETL & automated data ingestion jobs', queue_count: 5, job_count: 420, created_at: '2024-01-15T10:00:00Z' },
  { id: 'p2', name: 'Notification Service', description: 'SMS, Email, and Push notifications relay', queue_count: 2, job_count: 185, created_at: '2024-02-01T14:30:00Z' },
  { id: 'p3', name: 'Billing Analytics', description: 'Monthly invoice rendering and PDF generation', queue_count: 1, job_count: 64,  created_at: '2024-03-10T09:15:00Z' },
]

export default function Projects() {
  const qc = useQueryClient()
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search,   setSearch]   = useState('')
  const [sortCol,  setSortCol]  = useState('created_at')
  const [sortDir,  setSortDir]  = useState('desc')

  const [createModal, setCreateModal] = useState(false)
  const [editTgt,     setEditTgt]     = useState(null)
  const [delTgt,      setDelTgt]      = useState(null)

  const [form, setForm] = useState({ name: '', description: '' })
  const [formErr, setFormErr] = useState({})

  const { data: rawData = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try { return await projectsApi.list() }
      catch { return MOCK_PROJECTS }
    },
    refetchInterval: 5000,
  })

  const createMut = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setCreateModal(false)
      setForm({ name: '', description: '' })
      toast.success('Project created successfully')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => projectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setEditTgt(null)
      toast.success('Project updated successfully')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const deleteMut = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setDelTgt(null)
      toast.success('Project deleted successfully')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  function handleCreate(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Project name is required'
    setFormErr(errs)
    if (Object.keys(errs).length) return

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.organization_id) {
      toast.error('Organization ID not found. Please log in again.')
      return
    }

    createMut.mutate({ name: form.name, description: form.description, organization_id: user.organization_id })
  }

  function handleUpdate(e) {
    e.preventDefault()
    if (!editTgt.name.trim()) {
      toast.error('Project name cannot be empty')
      return
    }
    updateMut.mutate({ id: editTgt.id, data: { name: editTgt.name, description: editTgt.description } })
  }

  const projectsList = Array.isArray(rawData) ? rawData : (rawData?.items || [])

  const filteredProjects = useMemo(() => {
    return projectsList.filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
      let valA = a[sortCol] ?? ''
      let valB = b[sortCol] ?? ''
      if (sortCol === 'created_at') {
        valA = new Date(valA || 0).getTime()
        valB = new Date(valB || 0).getTime()
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [projectsList, search, sortCol, sortDir])

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const projects = filteredProjects.slice(start, end)
  const total = filteredProjects.length

  const totalQueues = projectsList.reduce((acc, p) => acc + (p.queue_count || 0), 0)
  const totalJobs   = projectsList.reduce((acc, p) => acc + (p.job_count || 0), 0)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Project Namespaces
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">{projectsList.length} total</span>
          </h1>
          <p className="text-xs text-slate-500">Logical containers organizing queues, workers, and background task workloads</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setForm({ name: '', description: '' }); setFormErr({}); setCreateModal(true) }}>
            New Project
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Active Namespaces</span>
            <span className="text-2xl font-bold text-indigo-400 mt-0.5 block tabular-nums">{projectsList.length}</span>
          </div>
          <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <FolderKanban className="size-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Allocated Queues</span>
            <span className="text-2xl font-bold text-violet-400 mt-0.5 block tabular-nums">{totalQueues}</span>
          </div>
          <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Layers className="size-5 text-violet-400" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Registered Jobs</span>
            <span className="text-2xl font-bold text-emerald-400 mt-0.5 block tabular-nums">{totalJobs}</span>
          </div>
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Briefcase className="size-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <input
            type="search" placeholder="Search by project name or description…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {search && <button onClick={() => { setSearch(''); setPage(1) }} className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2">Clear</button>}
      </div>

      {/* Projects Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <Thead>
            <Th sortable sorted={sortCol === 'name' ? sortDir : null} onClick={() => handleSort('name')}>Project Name</Th>
            <Th>Description</Th>
            <Th sortable sorted={sortCol === 'queue_count' ? sortDir : null} onClick={() => handleSort('queue_count')}>Queues</Th>
            <Th sortable sorted={sortCol === 'job_count' ? sortDir : null} onClick={() => handleSort('job_count')}>Jobs</Th>
            <Th sortable sorted={sortCol === 'created_at' ? sortDir : null} onClick={() => handleSort('created_at')}>Created</Th>
            <Th className="text-right">Actions</Th>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : projects.length === 0 ? (
              <EmptyRow
                cols={6}
                message="No projects found"
                icon={FolderKanban}
                description="Create your first project namespace to start organizing your background queues and worker jobs."
                actionLabel="Create Project"
                onAction={() => { setForm({ name: '', description: '' }); setCreateModal(true) }}
              />
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors group">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="size-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <FolderKanban className="size-4 text-indigo-400" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-200 block text-sm group-hover:text-indigo-400 transition-colors">{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {p.id}</span>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-400 max-w-sm truncate text-xs">
                    {p.description || <span className="italic text-slate-600">No description provided</span>}
                  </Td>
                  <Td>
                    <Badge variant="blue" className="font-mono">{p.queue_count ?? 0} queues</Badge>
                  </Td>
                  <Td>
                    <Badge variant="default" className="font-mono">{p.job_count ?? 0} jobs</Badge>
                  </Td>
                  <Td className="text-slate-500 text-xs">
                    {p.created_at ? formatRelative(p.created_at) : '—'}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTgt({ ...p })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => setDelTgt(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
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

      {/* Create Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Project Namespace"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={createMut.isPending} onClick={handleCreate}>Create Project</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Data Pipeline"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErr.name}
            required
          />
          <Input
            label="Description"
            placeholder="Optional purpose or scope description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTgt}
        onClose={() => setEditTgt(null)}
        title="Edit Project Namespace"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditTgt(null)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={updateMut.isPending} onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        {editTgt && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Project Name"
              value={editTgt.name}
              onChange={(e) => setEditTgt((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Description"
              value={editTgt.description || ''}
              onChange={(e) => setEditTgt((f) => ({ ...f, description: e.target.value }))}
            />
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!delTgt}
        onClose={() => setDelTgt(null)}
        onConfirm={() => deleteMut.mutate(delTgt?.id)}
        loading={deleteMut.isPending}
        title="Delete Project"
        message={`Are you sure you want to delete "${delTgt?.name}"? All associated queues and jobs will be affected. This action cannot be undone.`}
        confirmLabel="Delete Project"
        variant="danger"
      />
    </motion.div>
  )
}