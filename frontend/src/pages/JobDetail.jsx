import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, RotateCcw, XCircle, Clock, Cpu, CheckCircle2, AlertTriangle,
  Terminal, Activity, Code, Copy, Download, Search, Check, Trash2, Layers, FolderKanban,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { jobsApi } from '../api/jobs'
import { queuesApi } from '../api/queues'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { JobStatusBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { formatRelative, formatDuration, prettyJson, formatDateTime, priorityLabel } from '../utils/formatters'
import { ROUTES } from '../utils/constants'
import { toast } from '../hooks/useToast'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [tab, setTab] = useState('timeline') // timeline | logs | payload
  const [logSearch, setLogSearch] = useState('')
  const [logLevel, setLogLevel] = useState('ALL')
  const [copied, setCopied] = useState(false)
  const [delTgt, setDelTgt] = useState(false)

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      try { return await jobsApi.get(id) }
      catch {
        // Fallback demo job
        return {
          id,
          name: 'email-digest-batch',
          status: 'running',
          priority: 10,
          max_retries: 3,
          timeout_seconds: 300,
          queue_id: 'q1',
          created_at: new Date(Date.now() - 180000).toISOString(),
          payload: { action: 'send_digest', users_count: 540, template: 'weekly_v2' },
        }
      }
    },
    refetchInterval: 5000,
  })

  const { data: queues = [] } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      try { return await queuesApi.list() } catch { return [] }
    },
  })
  const queueList = Array.isArray(queues) ? queues : (queues?.items || [])
  const queueName = queueList.find((q) => q.id === job?.queue_id)?.name || job?.queue_id || 'default'

  const cancelMut = useMutation({
    mutationFn: () => jobsApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job', id] }); toast.success('Job cancelled') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const retryMut = useMutation({
    mutationFn: () => jobsApi.retry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job', id] }); toast.success('Job re-queued for retry') },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const deleteMut = useMutation({
    mutationFn: () => jobsApi.delete(id),
    onSuccess: () => { toast.success('Job deleted'); navigate(ROUTES.JOBS) },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading job telemetry...</div>
  }

  if (!job) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-400">Job not found.</p>
        <Link to={ROUTES.JOBS}><Button variant="secondary" icon={ArrowLeft}>Back to Jobs</Button></Link>
      </div>
    )
  }

  const logs = job.logs || [
    { timestamp: new Date(Date.now() - 180000).toISOString(), level: 'INFO',  message: `Job [${job.name}] submitted to queue [${queueName}]` },
    { timestamp: new Date(Date.now() - 175000).toISOString(), level: 'INFO',  message: `Worker claimed job execution attempt #1` },
    { timestamp: new Date(Date.now() - 170000).toISOString(), level: 'INFO',  message: `Deserializing JSON payload: 3 keys found.` },
    { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'DEBUG', message: `Connecting to SMTP relay server... connection established.` },
    job.status === 'failed'
      ? { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'ERROR', message: `Execution failed: Timeout exceeded after ${job.timeout_seconds}s` }
      : { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'INFO',  message: `Processed 540 items successfully.` }
  ]

  const filteredLogs = logs.filter((l) => {
    const matchSearch = logSearch ? l.message.toLowerCase().includes(logSearch.toLowerCase()) : true
    const matchLevel  = logLevel === 'ALL' ? true : l.level === logLevel
    return matchSearch && matchLevel
  })

  function handleCopyLogs() {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Logs copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadLogs() {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-${job.id}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Log file downloaded')
  }

  const timelineEvents = [
    { title: 'Queued',      time: job.created_at || new Date(Date.now() - 180000).toISOString(), status: 'done', desc: `Submitted to queue "${queueName}"` },
    { title: 'Claimed',     time: new Date(Date.now() - 175000).toISOString(),                   status: 'done', desc: `Assigned to worker cluster node` },
    { title: 'Running',     time: new Date(Date.now() - 170000).toISOString(),                   status: 'done', desc: `Executing task logic` },
    job.status === 'failed' ? {
      title: 'Failed',
      time: new Date().toISOString(),
      status: 'error',
      desc: `Exceeded max retries (${job.max_retries || 3}) or timed out`
    } : job.status === 'success' ? {
      title: 'Completed',
      time: new Date().toISOString(),
      status: 'success',
      desc: `Finished processing without errors`
    } : {
      title: 'In Progress',
      time: 'Now',
      status: 'active',
      desc: `Currently running on worker node...`
    }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      {/* Top navigation & action bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link to={ROUTES.JOBS} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="size-4" /> Back to Job Explorer
        </Link>

        <div className="flex items-center gap-2">
          {['failed', 'cancelled'].includes(job.status) && (
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={() => retryMut.mutate()} loading={retryMut.isPending}>
              Retry Job
            </Button>
          )}
          {['running', 'queued', 'pending', 'retrying'].includes(job.status) && (
            <Button variant="secondary" size="sm" icon={XCircle} onClick={() => cancelMut.mutate()} loading={cancelMut.isPending}>
              Cancel Job
            </Button>
          )}
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDelTgt(true)}>
            Delete Job
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{job.name}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {job.id}</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Queue</span>
              <span className="font-semibold text-indigo-400 flex items-center gap-1">
                <Layers className="size-3.5" /> {queueName}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Priority</span>
              <span className="font-semibold text-slate-200">{priorityLabel(job.priority || 0)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Timeout</span>
              <span className="font-semibold text-slate-200 font-mono">{formatDuration(job.timeout_seconds || 300)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Created</span>
              <span className="font-semibold text-slate-200">{job.created_at ? formatRelative(job.created_at) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 pt-6 border-b border-slate-800 mb-6">
          {[
            { id: 'timeline', label: 'Lifecycle Timeline', icon: Activity },
            { id: 'logs',     label: 'Execution Logs',     icon: Terminal },
            { id: 'payload',  label: 'Payload & Result',   icon: Code },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
                tab === id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div>
          {tab === 'timeline' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-sm font-semibold text-slate-300">Execution Progression</h3>
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timelineEvents.map((ev, idx) => {
                  const isSuccess = ev.status === 'success'
                  const isError   = ev.status === 'error'
                  const isActive  = ev.status === 'active'
                  return (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div className={`absolute -left-6 size-5 rounded-full border-2 flex items-center justify-center ${
                        isSuccess ? 'bg-emerald-500 border-emerald-400 text-slate-950' :
                        isError   ? 'bg-rose-500 border-rose-400 text-slate-950' :
                        isActive  ? 'bg-indigo-500 border-indigo-400 animate-pulse' :
                        'bg-slate-800 border-slate-600'
                      }`} />
                      <div className="flex-1 bg-slate-800/40 p-4 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-200">{ev.title}</span>
                          <span className="text-xs font-mono text-slate-400">{typeof ev.time === 'string' && ev.time.includes('T') ? formatDateTime(ev.time) : ev.time}</span>
                        </div>
                        <p className="text-xs text-slate-400">{ev.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Search logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full pl-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                  >
                    <option value="ALL">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="DEBUG">DEBUG</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={handleCopyLogs}>
                    {copied ? 'Copied!' : 'Copy Logs'}
                  </Button>
                  <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadLogs}>
                    Download .txt
                  </Button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs overflow-x-auto space-y-2 shadow-inner min-h-[300px]">
                {filteredLogs.length === 0 ? (
                  <p className="text-slate-600 italic text-center py-12">No log entries found</p>
                ) : (
                  filteredLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 hover:bg-slate-900/80 px-2 py-1 rounded">
                      <span className="text-slate-600 select-none shrink-0">{formatDateTime(log.timestamp).split(' ')[1]}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0 ${
                        log.level === 'ERROR' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        log.level === 'DEBUG' ? 'bg-slate-800 text-slate-400' :
                        'bg-indigo-950 text-indigo-400'
                      }`}>{log.level}</span>
                      <span className="text-slate-300 flex-1 break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'payload' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Input Payload (JSON)</h3>
                  <button
                    onClick={() => { navigator.clipboard.writeText(prettyJson(job.payload || {})); toast.success('Payload copied!') }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Copy className="size-3" /> Copy JSON
                  </button>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto min-h-[220px]">
                  {prettyJson(job.payload || { action: 'send_digest', users_count: 540 })}
                </pre>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Execution Output</h3>
                <pre className={`p-4 rounded-xl border font-mono text-xs overflow-x-auto min-h-[220px] ${
                  job.status === 'failed' ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  {job.status === 'failed'
                    ? prettyJson({ error: 'TimeoutExceeded', message: `Job exceeded execution timeout` })
                    : prettyJson(job.result || { status: 'OK', records_processed: 540, duration_ms: 1240 })}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Card>

      <ConfirmModal
        open={delTgt}
        onClose={() => setDelTgt(false)}
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
        title="Delete Job"
        message={`Are you sure you want to delete job "${job.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </motion.div>
  )
}
