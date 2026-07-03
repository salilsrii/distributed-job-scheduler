import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Briefcase, CheckCircle2, XCircle, Clock,
  Cpu, ListOrdered, TrendingUp, RefreshCw, ArrowRight,
} from 'lucide-react'
import { jobsApi } from '../api/jobs'
import { workersApi } from '../api/workers'
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { JobStatusBadge, WorkerStatusBadge } from '../components/ui/Badge'
import { Table, Thead, Th, Tbody, Td, EmptyRow } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { formatRelative, formatDuration } from '../utils/formatters'
import { ROUTES } from '../utils/constants'

// ── Mock data fallback when API is not yet ready ───────────────────
const MOCK_STATS = { total: 1284, running: 12, failed: 38, success: 1201, pending: 33 }
const MOCK_JOBS  = [
  { id: '1', name: 'email-digest', status: 'running',  queue: { name: 'email' },    created_at: new Date(Date.now() - 120_000).toISOString(),  timeout_seconds: 300 },
  { id: '2', name: 'report-gen',   status: 'success',  queue: { name: 'reports' },  created_at: new Date(Date.now() - 600_000).toISOString(),  timeout_seconds: 900 },
  { id: '3', name: 'data-import',  status: 'failed',   queue: { name: 'ingestion' },created_at: new Date(Date.now() - 3600_000).toISOString(), timeout_seconds: 600 },
  { id: '4', name: 'cleanup-task', status: 'queued',   queue: { name: 'system' },   created_at: new Date(Date.now() - 30_000).toISOString(),   timeout_seconds: 120 },
  { id: '5', name: 'thumbnail-gen',status: 'retrying', queue: { name: 'media' },    created_at: new Date(Date.now() - 900_000).toISOString(),  timeout_seconds: 60 },
]
const MOCK_WORKERS = [
  { id: 'w1', hostname: 'worker-01', status: 'online',   last_seen_at: new Date(Date.now() - 5_000).toISOString() },
  { id: 'w2', hostname: 'worker-02', status: 'busy',     last_seen_at: new Date(Date.now() - 2_000).toISOString() },
  { id: 'w3', hostname: 'worker-03', status: 'offline',  last_seen_at: new Date(Date.now() - 180_000).toISOString() },
  { id: 'w4', hostname: 'worker-04', status: 'draining', last_seen_at: new Date(Date.now() - 10_000).toISOString() },
]

function useMockOrReal(queryKey, apiFn, mockData) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try { return await apiFn() } catch { return mockData }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export default function Dashboard() {
  const statsQ   = useMockOrReal(['job-stats'],    jobsApi.stats,    MOCK_STATS)
  const recentQ  = useMockOrReal(['jobs-recent'],  () => jobsApi.list({ limit: 5 }), { items: MOCK_JOBS, total: 5 })
  const workersQ = useMockOrReal(['workers-list'], () => workersApi.list({ limit: 4 }), { items: MOCK_WORKERS, total: 4 })

  const stats   = statsQ.data ?? MOCK_STATS
  const jobs    = recentQ.data?.items ?? MOCK_JOBS
  const workers = workersQ.data?.items ?? MOCK_WORKERS

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Jobs"  value={stats.total}   icon={Briefcase} color="indigo"  loading={statsQ.isLoading} />
        <StatCard title="Running"     value={stats.running} icon={TrendingUp} color="blue"   loading={statsQ.isLoading} subtitle="In progress" />
        <StatCard title="Succeeded"   value={stats.success} icon={CheckCircle2} color="emerald" loading={statsQ.isLoading} />
        <StatCard title="Failed"      value={stats.failed}  icon={XCircle}   color="rose"   loading={statsQ.isLoading} trend={-3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <Link to={ROUTES.JOBS}>
                <Button variant="ghost" size="sm" iconRight={ArrowRight}>View all</Button>
              </Link>
            </CardHeader>
            <Table>
              <Thead>
                <Th>Name</Th>
                <Th>Queue</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Timeout</Th>
              </Thead>
              <Tbody>
                {recentQ.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  : jobs.length === 0
                  ? <EmptyRow cols={5} message="No recent jobs" />
                  : jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                      <Td>
                        <Link to={`/jobs/${job.id}`} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                          {job.name}
                        </Link>
                      </Td>
                      <Td><span className="text-slate-400">{job.queue?.name ?? '—'}</span></Td>
                      <Td><JobStatusBadge status={job.status} /></Td>
                      <Td className="text-slate-500 text-xs">{formatRelative(job.created_at)}</Td>
                      <Td className="text-slate-500 text-xs">{formatDuration(job.timeout_seconds)}</Td>
                    </tr>
                  ))
                }
              </Tbody>
            </Table>
          </Card>
        </div>

        {/* Workers sidebar */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Workers</CardTitle>
              <Link to={ROUTES.WORKERS}>
                <Button variant="ghost" size="sm" iconRight={ArrowRight}>All</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {workersQ.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))
                : workers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Cpu className="size-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{w.hostname}</p>
                        <p className="text-xs text-slate-600">{formatRelative(w.last_seen_at)}</p>
                      </div>
                    </div>
                    <WorkerStatusBadge status={w.status} />
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
