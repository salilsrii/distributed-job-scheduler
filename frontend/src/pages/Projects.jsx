import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, FolderKanban, Search, RefreshCw } from 'lucide-react'
import { projectsApi } from '../api/projects'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { Table, Thead, Th, Tbody, Td, EmptyRow, Pagination } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
import { formatDateTime, formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const MOCK_PROJECTS = [
  { id: 'p1', name: 'Data Pipeline', description: 'ETL & ingestion jobs', queue_count: 3, job_count: 142, created_at: '2024-01-15T10:00:00Z' },
  { id: 'p2', name: 'Email Campaigns', description: 'Marketing automation', queue_count: 1, job_count: 58, created_at: '2024-02-01T09:00:00Z' },
  { id: 'p3', name: 'Report Generation', description: 'Nightly analytics reports', queue_count: 2, job_count: 310, created_at: '2023-12-01T08:00:00Z' },
  { id: 'p4', name: 'Media Processing', description: 'Transcoding & thumbnails', queue_count: 4, job_count: 75, created_at: '2024-03-10T11:00:00Z' },
]

const PAGE_SIZE = 10

export default function Projects() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [create, setCreate] = useState(false)
  const [delTgt, setDelTgt] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formErr, setFormErr] = useState({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: async () => {
      try {
        return await projectsApi.list({ page, page_size: PAGE_SIZE, search })
      } catch {
        const filtered = MOCK_PROJECTS.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        )
        return { items: filtered, total: filtered.length }
      }
    },
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setCreate(false)
      setForm({ name: '', description: '' })
      toast.success('Project created')
    },
    onError: (e) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setDelTgt(null)
      toast.success('Project deleted')
    },
    onError: (e) => toast.error(e.message),
  })

  function handleCreate(e) {
    e.preventDefault()

    const errs = {}

    if (!form.name.trim()) {
      errs.name = 'Name is required'
    }

    setFormErr(errs)

    if (Object.keys(errs).length) return

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (!user.organization_id) {
      toast.error('Organization ID not found. Please log in again.')
      return
    }

    createMut.mutate({
      name: form.name,
      description: form.description,
      organization_id: user.organization_id,
    })
  }

  const projects = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreate(true)}>New Project</Button>
        </div>
      </div>

      <Card>
        <Table>
          <Thead>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Queues</Th>
            <Th>Jobs</Th>
            <Th>Created</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : projects.length === 0
                ? <EmptyRow cols={6} message="No projects found" />
                : projects.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <FolderKanban className="size-4 text-indigo-400" />
                        </span>
                        <span className="font-medium text-slate-200">{p.name}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-500 max-w-xs truncate">{p.description ?? '—'}</Td>
                    <Td><Badge variant="blue">{p.queue_count ?? 0} queues</Badge></Td>
                    <Td><Badge>{p.job_count ?? 0} jobs</Badge></Td>
                    <Td className="text-slate-500 text-xs">{formatRelative(p.created_at)}</Td>
                    <Td>
                      <button
                        onClick={() => setDelTgt(p)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </Td>
                  </tr>
                ))
            }
          </Tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </Card>

      {/* Create modal */}
      <Modal open={create} onClose={() => setCreate(false)} title="New Project"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={createMut.isPending} onClick={handleCreate}>Create</Button>
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
            placeholder="Optional description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!delTgt}
        onClose={() => setDelTgt(null)}
        onConfirm={() => deleteMut.mutate(delTgt?.id)}
        loading={deleteMut.isPending}
        title="Delete Project"
        message={`Are you sure you want to delete "${delTgt?.name}"? This will remove all associated queues and jobs.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
