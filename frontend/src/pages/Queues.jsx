import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  Search,
  ListOrdered,
  AlertCircle,
} from 'lucide-react'

import { queuesApi } from '../api/queues'
import { projectsApi } from '../api/projects'

import {
  Card,
} from '../components/ui/Card'

import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

import {
  Modal,
  ConfirmModal,
} from '../components/ui/Modal'

import {
  Input,
  Select,
} from '../components/ui/Input'

import {
  Table,
  Thead,
  Th,
  Tbody,
  Td,
  EmptyRow,
  Pagination,
} from '../components/ui/Table'

import { SkeletonRow } from '../components/ui/Spinner'
import { formatRelative } from '../utils/formatters'
import { toast } from '../hooks/useToast'

const PAGE_SIZE = 10

const MOCK_QUEUES = [
  {
    id: '1',
    name: 'email',
    description: 'Email processing',
    depth: 5,
    is_paused: false,
    max_concurrency: 4,
    created_at: new Date().toISOString(),
  },
]

export default function Queues() {
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [create, setCreate] = useState(false)
  const [delTgt, setDelTgt] = useState(null)

  const [form, setForm] = useState({
    project_id: '',
    name: '',
    description: '',
    max_concurrency: 4,
  })

  const [formErr, setFormErr] = useState({})
  // -----------------------------
  // Load Projects
  // -----------------------------
  const {
    data: projectsData = [],
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        return await projectsApi.list()
      } catch {
        return []
      }
    },
  })

  const projectOptions = projectsData.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  // -----------------------------
  // Load Queues
  // -----------------------------
  const {
    data: queuesData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      try {
        return await queuesApi.list()
      } catch {
        return MOCK_QUEUES
      }
    },
  })

  const filteredQueues = queuesData.filter((queue) =>
    queue.name.toLowerCase().includes(search.toLowerCase()),
  )

  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  const queues = filteredQueues.slice(start, end)
  const total = filteredQueues.length

  // -----------------------------
  // Pause / Resume
  // -----------------------------
  const pauseMut = useMutation({
    mutationFn: ({ id, paused }) =>
      paused
        ? queuesApi.resume(id)
        : queuesApi.pause(id),

    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ['queues'],
      })

      toast.success(
        vars.paused
          ? 'Queue resumed'
          : 'Queue paused',
      )
    },

    onError: (e) =>
      toast.error(
        e?.response?.data?.detail ||
        e?.message ||
        'Unexpected error',
      ),
  })

  // -----------------------------
  // Create Queue
  // -----------------------------
  const createMut = useMutation({
    mutationFn: queuesApi.create,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['queues'],
      })

      setCreate(false)

      setForm({
        project_id: '',
        name: '',
        description: '',
        max_concurrency: 4,
      })

      toast.success('Queue created')
    },

    onError: (e) => {
      console.error(e)

      toast.error(
        e?.response?.data?.detail ||
        e?.message ||
        'Unexpected error',
      )
    },
  })
  // -----------------------------
  // Delete Queue
  // -----------------------------
  const deleteMut = useMutation({
    mutationFn: queuesApi.delete,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['queues'],
      })

      setDelTgt(null)

      toast.success('Queue deleted')
    },

    onError: (e) => {
      toast.error(
        e?.response?.data?.detail ||
        e?.message ||
        'Unexpected error',
      )
    },
  })

  // -----------------------------
  // Create Queue
  // -----------------------------
  function handleCreate(e) {
    e.preventDefault()

    const errs = {}

    if (!form.project_id) {
      errs.project_id = 'Project is required'
    }

    if (!form.name.trim()) {
      errs.name = 'Queue name is required'
    }

    if (!form.max_concurrency || form.max_concurrency < 1) {
      errs.max_concurrency = 'Concurrency must be at least 1'
    }

    setFormErr(errs)

    if (Object.keys(errs).length > 0) {
      return
    }

    createMut.mutate({
      project_id: form.project_id,
      name: form.name,
      description: form.description || null,
      max_concurrency: Number(form.max_concurrency),
    })
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">

        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />

          <input
            type="search"
            placeholder="Search queues..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => refetch()}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreate(true)}
          >
            New Queue
          </Button>

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

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={7} />
              ))
            ) : queues.length === 0 ? (
              <EmptyRow
                cols={7}
                message="No queues found"
              />
            ) : (
              queues.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors"
                >
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ListOrdered className="size-4 text-amber-400" />
                      </span>

                      <span className="font-medium text-slate-200">
                        {q.name}
                      </span>
                    </div>
                  </Td>

                  <Td className="text-slate-500">
                    {q.description ?? '—'}
                  </Td>

                  <Td>
                    {q.depth ?? 0}
                  </Td>

                  <Td>
                    {q.max_concurrency ?? q.concurrency ?? 1}
                  </Td>

                  <Td>
                    {q.is_paused ? (
                      <Badge variant="amber">Paused</Badge>
                    ) : (
                      <Badge variant="green">Active</Badge>
                    )}
                  </Td>

                  <Td>
                    {q.created_at
                      ? formatRelative(q.created_at)
                      : '—'}
                  </Td>

                  <Td>
                    <div className="flex gap-1">

                      <button
                        onClick={() =>
                          pauseMut.mutate({
                            id: q.id,
                            paused: q.is_paused,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-950/30"
                      >
                        {q.is_paused ? (
                          <Play className="size-4" />
                        ) : (
                          <Pause className="size-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setDelTgt(q)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/30"
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
          pageSize={PAGE_SIZE}
          total={total}
          onPage={setPage}
        />

      </Card>

      {/* Create Queue */}

      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="New Queue"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreate(false)}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              loading={createMut.isPending}
              onClick={handleCreate}
            >
              Create Queue
            </Button>
          </>
        }
      >

        <form
          onSubmit={handleCreate}
          className="space-y-4"
        >

          <Select
            label="Project"
            required
            value={form.project_id}
            options={projectOptions}
            placeholder="Select Project"
            error={formErr.project_id}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                project_id: e.target.value,
              }))
            }
          />

          <Input
            label="Queue Name"
            required
            value={form.name}
            error={formErr.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
              }))
            }
          />

          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                description: e.target.value,
              }))
            }
          />

          <Input
            label="Max Concurrency"
            type="number"
            min={1}
            value={form.max_concurrency}
            error={formErr.max_concurrency}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                max_concurrency:
                  Number(e.target.value) || 1,
              }))
            }
          />

        </form>

      </Modal>

      <ConfirmModal
        open={!!delTgt}
        onClose={() => setDelTgt(null)}
        onConfirm={() =>
          deleteMut.mutate(delTgt?.id)
        }
        loading={deleteMut.isPending}
        title="Delete Queue"
        message={`Delete queue "${delTgt?.name}"?`}
        confirmLabel="Delete"
      />

    </div>
  )
}

