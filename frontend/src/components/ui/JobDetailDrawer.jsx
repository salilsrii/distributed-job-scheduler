import React, { useState } from 'react'
import {
  X, Clock, Cpu, CheckCircle2, XCircle, RotateCcw, AlertTriangle,
  FileText, Code, Activity, Copy, Download, Search, Check, Terminal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { JobStatusBadge } from './Badge'
import { Button } from './Button'
import { formatRelative, formatDuration, prettyJson, formatDateTime } from '../../utils/formatters'
import { priorityLabel } from '../../utils/formatters'
import { toast } from '../../hooks/useToast'

export function JobDetailDrawer({ job, open, onClose, onRetry, onCancel }) {
  const [tab, setTab] = useState('timeline') // timeline | logs | payload
  const [logSearch, setLogSearch] = useState('')
  const [logLevel, setLogLevel] = useState('ALL')
  const [copied, setCopied] = useState(false)

  if (!open || !job) return null

  // Generate mock logs if API doesn't provide them yet
  const logs = job.logs || [
    { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: `Job [${job.name}] queued in queue [${job.queue_id || 'default'}]` },
    { timestamp: new Date(Date.now() - 58000).toISOString(), level: 'INFO', message: `Worker claimed job execution attempt #1` },
    { timestamp: new Date(Date.now() - 55000).toISOString(), level: 'INFO', message: `Starting payload deserialization and parameter validation...` },
    { timestamp: new Date(Date.now() - 40000).toISOString(), level: 'DEBUG',message: `Connecting to remote database instance... connection established.` },
    job.status === 'failed' 
      ? { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'ERROR', message: `Execution failed: Timeout exceeded after ${job.timeout_seconds || 300}s` }
      : { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'INFO', message: `Task completed successfully with code 0.` }
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

  // Timeline events
  const timelineEvents = [
    { title: 'Queued',      time: job.created_at || new Date(Date.now() - 120000).toISOString(), status: 'done', desc: `Submitted to queue [${job.queue_id || 'default'}]` },
    { title: 'Claimed',     time: new Date(Date.now() - 100000).toISOString(),                   status: 'done', desc: `Assigned to worker [${job.worker_id || 'worker-prod-01'}]` },
    { title: 'Running',     time: new Date(Date.now() - 95000).toISOString(),                    status: 'done', desc: `Executing task processing` },
    job.status === 'failed' ? {
      title: 'Failed',
      time: new Date().toISOString(),
      status: 'error',
      desc: `Exceeded max retries (${job.max_retries || 3}) or timed out`
    } : job.status === 'success' ? {
      title: 'Completed',
      time: new Date().toISOString(),
      status: 'success',
      desc: `Finished processing in ${formatDuration(job.timeout_seconds || 45)}`
    } : {
      title: 'In Progress',
      time: 'Now',
      status: 'active',
      desc: `Currently processing...`
    }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-3xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    {job.name}
                  </h2>
                  <JobStatusBadge status={job.status} />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {job.id}</p>
              </div>

              <div className="flex items-center gap-2">
                {['failed', 'cancelled'].includes(job.status) && onRetry && (
                  <Button variant="primary" size="sm" icon={RotateCcw} onClick={() => onRetry(job.id)}>Retry</Button>
                )}
                {['running', 'queued', 'pending'].includes(job.status) && onCancel && (
                  <Button variant="secondary" size="sm" onClick={() => onCancel(job.id)}>Cancel</Button>
                )}
                <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Priority</span>
                <span className="font-semibold text-slate-200">{priorityLabel(job.priority || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Attempts</span>
                <span className="font-semibold text-slate-200 font-mono">1 / {job.max_retries || 3}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timeout</span>
                <span className="font-semibold text-slate-200">{formatDuration(job.timeout_seconds || 300)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Created</span>
                <span className="font-semibold text-slate-200">{job.created_at ? formatRelative(job.created_at) : 'Just now'}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-6 bg-slate-900">
              {[
                { id: 'timeline', label: 'Execution Timeline', icon: Activity },
                { id: 'logs',     label: 'Execution Logs',     icon: Terminal },
                { id: 'payload',  label: 'Payload & Result',   icon: Code },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                    tab === id
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TIMELINE TAB */}
              {tab === 'timeline' && (
                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                  <h3 className="text-sm font-semibold text-slate-300">Lifecycle Progress</h3>
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {timelineEvents.map((ev, idx) => {
                      const isSuccess = ev.status === 'success'
                      const isError   = ev.status === 'error'
                      const isActive  = ev.status === 'active'
                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 size-4 rounded-full border-2 flex items-center justify-center ${
                            isSuccess ? 'bg-emerald-500 border-emerald-400 text-slate-950' :
                            isError   ? 'bg-rose-500 border-rose-400 text-slate-950' :
                            isActive  ? 'bg-indigo-500 border-indigo-400 animate-pulse' :
                            'bg-slate-800 border-slate-600'
                          }`} />
                          <div className="flex-1 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm text-slate-200">{ev.title}</span>
                              <span className="text-xs font-mono text-slate-500">{typeof ev.time === 'string' && ev.time.includes('T') ? formatDateTime(ev.time) : ev.time}</span>
                            </div>
                            <p className="text-xs text-slate-400">{ev.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* LOGS TAB */}
              {tab === 'logs' && (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out] flex flex-col h-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
                        <input
                          type="search"
                          placeholder="Search logs..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="w-full pl-8 h-8 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <select
                        value={logLevel}
                        onChange={(e) => setLogLevel(e.target.value)}
                        className="h-8 px-2 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300"
                      >
                        <option value="ALL">All Levels</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" icon={copied ? Check : Copy} onClick={handleCopyLogs}>
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button variant="ghost" size="sm" icon={Download} onClick={handleDownloadLogs}>
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Terminal code viewer */}
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-1.5 shadow-inner">
                    {filteredLogs.length === 0 ? (
                      <p className="text-slate-600 italic text-center py-8">No log output matches filter</p>
                    ) : (
                      filteredLogs.map((log, i) => {
                        const isErr = log.level === 'ERROR' || log.level === 'WARN'
                        return (
                          <div key={i} className="flex items-start gap-3 hover:bg-slate-900/60 px-2 py-0.5 rounded leading-relaxed">
                            <span className="text-slate-600 select-none shrink-0">{formatDateTime(log.timestamp).split(' ')[1]}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] shrink-0 ${
                              log.level === 'ERROR' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                              log.level === 'WARN'  ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              log.level === 'DEBUG' ? 'bg-slate-800 text-slate-400' :
                              'bg-indigo-950 text-indigo-400'
                            }`}>
                              {log.level}
                            </span>
                            <span className={`flex-1 break-all ${isErr ? 'text-rose-300 font-semibold' : 'text-slate-300'}`}>
                              {log.message}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* PAYLOAD TAB */}
              {tab === 'payload' && (
                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
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
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                      {prettyJson(job.payload || { action: 'demo-task', timestamp: Date.now(), params: { verbose: true, retry_limit: 3 } })}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Execution Result / Error</h3>
                    <pre className={`p-4 rounded-xl border font-mono text-xs overflow-x-auto ${
                      job.status === 'failed' ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}>
                      {job.status === 'failed'
                        ? prettyJson({ error: 'TimeoutExceeded', message: `Job exceeded execution timeout of ${job.timeout_seconds || 300}s`, attempt: 3 })
                        : prettyJson(job.result || { status: 'OK', records_processed: 1420, execution_time_ms: 1240 })}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
