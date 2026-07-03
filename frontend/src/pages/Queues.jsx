import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pause, Play, Trash2, RefreshCw, Search,
  ListOrdered, AlertCircle,
} from 'lucide-react'
import { queuesApi } from '../api/queues'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { Table, Thead, Th, Tbody, Td, EmptyRow, Pagination } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
import { formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const MOCK_QUEUES = [
  { id: 'q1', name: 'email',     description: 'Email delivery',    depth: 14,  is_paused: false, concurrency: 5,  created_at: '2024-01-15T10:00:00Z' },
  { id: 'q2', name: 'reports',   description: 'Report generation', depth: 3,   is_paused: false, concurrency: 2,  created_at: '2024-01-16T11:00:00Z' },
  { id: 'q3', name: 'ingestion', description: 'Data import',       depth: 102, is_paused: true,  concurrency: 10, created_at: '2023-12-10T09:00:00Z' },
  { id: 'q4', name: 'media',     description: 'Media processing',  depth: 7,   is_paused: false, concurrency: 4,  created_at: '2024-02-01T14:00:00Z' },
  { id: 'q5', name: 'system',    description: 'System maintenance', depth: 1,  is_paused: false, concurrency: 1,  created_at: '2024-01-01T00:00:00Z' },
]

const PAGE_SIZE = 10

export default function Queues() {
  const qc = useQueryClient()
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [create, setCreate] = useState(false)
  const [delTgt, setDelTgt] = useState(null)
  const [form,   setForm]   = useState({ name: '', description: '', concurrency: 4 })
  const [formErr,setFormErr]= useState({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['queues', page, search],
    queryFn: async () => {
      try {
        return await queuesApi.list({ page, page_size: PAGE_SIZE, search })
      } catch {
        const filtered = MOCK_QUEUES.filter((q) =>
          q.name.toLowerCase().includes(search.toLowerCase()),
        )
        return { items: filtered, total: filtered.length }
      }
    },
    placeholderData: (prev) => prev,
  })

  const pauseMut = useMutation({
    mutationFn: ({ id, paused }) => paused ? queuesApi.resume(id) : queuesApi.pause(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['queues'] })
      toast.success(vars.paused ? 'Queue resumed' : 'Queue paused')
    },
    onError: (e) => toast.error(e.message),
  })

  const createMut = useMutation({
    mutationFn: queuesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queues'] })
      setCreate(false)
      setForm({ name: '', description: '', concurrency: 4 })
      toast.success('Queue created')
    },
    onError: (e) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: queuesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queues'] })
      setDelTgt(null)
      toast.success('Queue deleted')
    },
    onError: (e) => toast.error(e.message),
  })

  function handleCreate(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    setFormErr(errs)
    if (Object.keys(errs).length) return
    createMut.mutate(form)
  }

  const queues = data?.items ?? []
  const total  = data?.total ?? 0

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            placeholder="Search queues…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreate(true)}>New Queue</Button>
        </div>
      </div>

      <Card>
        <Table>
          <Thead>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Depth</Th>
            <Th>Concurrency</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : queues.length === 0
              ? <EmptyRow cols={7} message="No queues found" />
              : queues.map((q) => (
                <tr key={q.id} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ListOrdered className="size-4 text-amber-400" />
                      </span>
                      <span className="font-medium text-slate-200">{q.name}</span>
                    </div>
                  </Td>
                  <Td className="text-slate-500">{q.description ?? '—'}</Td>
                  <Td>
                    <span className={`font-mono font-semibold text-sm ${q.depth > 50 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {q.depth}
                    </span>
                    {q.depth > 50 && <AlertCircle className="inline ml-1 size-3 text-amber-400" />}
                  </Td>
                  <Td className="text-slate-400 font-mono">{q.concurrency}x</Td>
                  <Td>
                    {q.is_paused
                      ? <Badge variant="amber">Paused</Badge>
                      : <Badge variant="green">Active</Badge>
                    }
                  </Td>
                  <Td className="text-slate-500 text-xs">{formatRelative(q.created_at)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => pauseMut.mutate({ id: q.id, paused: q.is_paused })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-950/30 transition-colors"
                        title={q.is_paused ? 'Resume queue' : 'Pause queue'}
                      >
                        {q.is_paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                      </button>
                      <button
                        onClick={() => setDelTgt(q)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        aria-label={`Delete ${q.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            }
          </Tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </Card>

      {/* Create modal */}
      <Modal open={create} onClose={() => setCreate(false)} title="New Queue"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={createMut.isPending} onClick={handleCreate}>Create Queue</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Queue Name" placeholder="e.g. emails" required
            value={form.name} error={formErr.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Description" placeholder="Optional"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Concurrency" type="number" min={1} max={100}
            value={form.concurrency}
            onChange={(e) => setForm((f) => ({ ...f, concurrency: parseInt(e.target.value) || 1 }))}
            hint="Max parallel jobs for this queue"
          />
        </form>
      </Modal>

      <ConfirmModal
        open={!!delTgt} onClose={() => setDelTgt(null)}
        onConfirm={() => deleteMut.mutate(delTgt?.id)}
        loading={deleteMut.isPending}
        title="Delete Queue"
        message={`Delete queue "${delTgt?.name}"? All pending jobs in this queue will be removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
