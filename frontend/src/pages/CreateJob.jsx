import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight, ChevronLeft, Code, Sparkles, Clock, Calendar, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { jobsApi } from '../api/jobs'
import { queuesApi } from '../api/queues'
import { Button } from '../components/ui/Button'
import { Input, Textarea, Select } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { ROUTES, BACKOFF_STRATEGIES } from '../utils/constants'
import { toast } from '../hooks/useToast'
import { prettyJson } from '../utils/formatters'

const STEPS = ['Basic Info', 'Payload Builder', 'Scheduling & Retry', 'Review & Submit']

const TEMPLATES = [
  {
    name: 'Email Digest',
    icon: '📧',
    desc: 'Send batch HTML email report',
    payload: { action: 'send_email_digest', template: 'weekly_summary', recipients: ['admin@enterprise.io', 'ops@enterprise.io'], dry_run: false }
  },
  {
    name: 'Webhook Relay',
    icon: '🪝',
    desc: 'POST JSON payload to external endpoint',
    payload: { action: 'relay_webhook', target_url: 'https://api.partner.com/v1/sync', headers: { 'X-Signature': 'sha256=xxx' }, retry_on_timeout: true }
  },
  {
    name: 'Data Processing',
    icon: '📊',
    desc: 'Run distributed database ETL aggregation',
    payload: { action: 'run_etl_pipeline', source_table: 'raw_events_2026', batch_size: 5000, optimize_indexes: true }
  },
  {
    name: 'Image Resize',
    icon: '🖼️',
    desc: 'Generate multi-resolution thumbnails',
    payload: { action: 'process_media', asset_id: 'img_99281a', dimensions: [{ w: 100, h: 100 }, { w: 600, h: 400 }], format: 'webp' }
  }
]

const DEFAULT_FORM = {
  name: '',
  description: '',
  queue_id: '',
  priority: 0,
  max_retries: 3,
  timeout_seconds: 300,
  payload: '{\n  "action": "default_task",\n  "timestamp": ' + Date.now() + '\n}',
  backoff_strategy: 'exponential',
  backoff_base: 30,
  schedule_type: 'immediate', // immediate | cron | delayed
  cron_expression: '',
  run_at: '',
}

function StepIndicator({ current, onSelectStep }) {
  return (
    <nav className="flex items-center justify-between gap-2 mb-8 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <button
            key={label}
            type="button"
            onClick={() => { if (done || active) onSelectStep(i) }}
            className={`flex items-center gap-2.5 transition-all ${done || active ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
          >
            <div className={`flex items-center justify-center size-8 rounded-xl text-xs font-bold border transition-all duration-200 ${
              done   ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' :
              active ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 scale-105' :
              'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {done ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className={`text-xs font-bold hidden sm:inline ${active ? 'text-slate-100' : done ? 'text-indigo-400' : 'text-slate-500'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-12 mx-1 rounded transition-colors ${i < current ? 'bg-indigo-600' : 'bg-slate-800'}`} />
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default function CreateJob() {
  const navigate = useNavigate()
  const [step,    setStep]    = useState(0)
  const [form,    setForm]    = useState(DEFAULT_FORM)
  const [errors,  setErrors]  = useState({})
  const [jsonErr, setJsonErr] = useState('')

  const queuesQ = useQuery({
    queryKey: ['queues-for-select'],
    queryFn: async () => {
      try { return await queuesApi.list({ limit: 100 }) }
      catch { return { items: [
        { id: 'q1', name: 'email' },
        { id: 'q2', name: 'reports' },
        { id: 'q3', name: 'ingestion' },
        { id: 'q4', name: 'media' },
        { id: 'q5', name: 'system' },
      ]}}
    },
    staleTime: 60_000,
  })
  const queuesList = Array.isArray(queuesQ.data) ? queuesQ.data : (queuesQ.data?.items ?? [])

  const createMut = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => {
      toast.success('Job created and dispatched to queue!')
      navigate(ROUTES.JOBS)
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateStep0() {
    const e = {}
    if (!form.name.trim()) e.name = 'Job name is required'
    if (!form.queue_id)    e.queue_id = 'Please select a queue channel'
    if (form.timeout_seconds < 1) e.timeout_seconds = 'Must be > 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep1() {
    try {
      JSON.parse(form.payload)
      setJsonErr('')
      return true
    } catch (e) {
      setJsonErr(`Invalid JSON syntax: ${e.message}`)
      return false
    }
  }

  function next() {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    setStep((s) => s + 1)
  }
  function back() { setStep((s) => Math.max(0, s - 1)) }

  function submit() {
    const payload = JSON.parse(form.payload)
    const body = {
      name:            form.name,
      description:     form.description || undefined,
      queue_id:        form.queue_id,
      priority:        Number(form.priority),
      max_retries:     Number(form.max_retries),
      timeout_seconds: Number(form.timeout_seconds),
      payload,
      retry_policy: {
        backoff_strategy: form.backoff_strategy,
        backoff_base:     Number(form.backoff_base),
      },
      ...(form.schedule_type === 'cron'    && form.cron_expression ? { cron_expression: form.cron_expression } : {}),
      ...(form.schedule_type === 'delayed' && form.run_at          ? { run_at: form.run_at }                   : {}),
    }
    createMut.mutate(body)
  }

  const queueOptions = queuesList.map((q) => ({ value: q.id, label: `${q.name} (${q.id.slice(0, 8)})` }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Create New Job Task</h1>
          <p className="text-xs text-slate-500">Configure parameters, select payload templates, and set scheduling triggers</p>
        </div>
      </div>

      <StepIndicator current={step} onSelectStep={setStep} />

      <Card className="bg-slate-900 border-slate-800 p-0 overflow-hidden shadow-xl">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 0: Basic Info */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-slate-100">1. Basic Task Parameters</h2>
                    <p className="text-xs text-slate-500">Provide an identifier and choose which target execution queue will handle this job.</p>
                  </div>

                  <Input
                    label="Job Name" placeholder="e.g. send-weekly-digest-report" required
                    value={form.name} error={errors.name}
                    onChange={(e) => set('name', e.target.value)}
                  />

                  <Textarea
                    label="Description" placeholder="Explain what background computation or IO operation this job performs..." rows={2}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />

                  <Select
                    label="Target Queue Channel" placeholder="Select an execution queue…" required
                    options={queueOptions}
                    value={form.queue_id} error={errors.queue_id}
                    onChange={(e) => set('queue_id', e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <Input
                      label="Priority Tier" type="number" min={0} max={100}
                      value={form.priority}
                      onChange={(e) => set('priority', e.target.value)}
                      hint="0=Normal, 10=High, 100=Critical"
                    />
                    <Input
                      label="Max Retries" type="number" min={0} max={20}
                      value={form.max_retries}
                      onChange={(e) => set('max_retries', e.target.value)}
                      hint="Attempts before dead-lettering"
                    />
                    <Input
                      label="Timeout (seconds)" type="number" min={1}
                      value={form.timeout_seconds} error={errors.timeout_seconds}
                      onChange={(e) => set('timeout_seconds', e.target.value)}
                      hint="Max duration per attempt"
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: Payload Builder */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-100">2. Payload Builder (JSON)</h2>
                      <p className="text-xs text-slate-500">Configure parameters passed into the worker function upon execution.</p>
                    </div>
                    <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => {
                      try { set('payload', prettyJson(JSON.parse(form.payload))) } catch {}
                    }}>
                      Format JSON
                    </Button>
                  </div>

                  {/* Template selector */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Pre-built Payload Templates</label>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => {
                            set('payload', prettyJson(tpl.payload))
                            toast.success(`Loaded "${tpl.name}" template`)
                          }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-left transition-all group"
                        >
                          <span className="text-xl shrink-0">{tpl.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{tpl.name}</p>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{tpl.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* JSON Editor */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                      <span>JSON Input Structure</span>
                      {jsonErr ? <span className="text-rose-400 font-normal">{jsonErr}</span> : <span className="text-emerald-400 font-normal">Valid JSON</span>}
                    </label>
                    <textarea
                      rows={12}
                      className={`w-full rounded-xl bg-slate-950 font-mono text-xs text-slate-200 p-4 border focus:outline-none transition-colors resize-none shadow-inner ${
                        jsonErr ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                      value={form.payload}
                      onChange={(e) => { set('payload', e.target.value); setJsonErr('') }}
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Scheduling & Retry */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-slate-100">3. Scheduling Triggers & Retry Policy</h2>
                    <p className="text-xs text-slate-500">Control when the job runs and how failures are retried automatically.</p>
                  </div>

                  {/* Schedule Type Radio Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Execution Trigger Mode</label>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { id: 'immediate', label: 'Run Immediately', icon: Zap,      desc: 'Dispatch directly to target queue' },
                        { id: 'cron',      label: 'Cron Schedule',   icon: Calendar, desc: 'Recurring schedule via cron pattern' },
                        { id: 'delayed',   label: 'Delayed One-time',icon: Clock,    desc: 'Run at specific future datetime' },
                      ].map(({ id, label, icon: Icon, desc }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => set('schedule_type', id)}
                          className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                            form.schedule_type === id
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{label}</span>
                            <Icon className={`size-4 ${form.schedule_type === id ? 'text-indigo-400' : 'text-slate-500'}`} />
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional inputs */}
                  {form.schedule_type === 'cron' && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                      <Input
                        label="Cron Expression Pattern"
                        placeholder="e.g. 0 9 * * 1 (Every Monday at 09:00 AM)"
                        value={form.cron_expression}
                        onChange={(e) => set('cron_expression', e.target.value)}
                        hint="Standard 5-part cron syntax (minute hour day month weekday)"
                      />
                    </motion.div>
                  )}

                  {form.schedule_type === 'delayed' && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                      <Input
                        label="Run At Future Datetime"
                        type="datetime-local"
                        value={form.run_at}
                        onChange={(e) => set('run_at', e.target.value)}
                      />
                    </motion.div>
                  )}

                  {/* Retry Policy */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Backoff & Retry Policy</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Select
                        label="Backoff Strategy"
                        options={BACKOFF_STRATEGIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                        value={form.backoff_strategy}
                        onChange={(e) => set('backoff_strategy', e.target.value)}
                      />
                      <Input
                        label="Base Backoff Delay (seconds)"
                        type="number"
                        min={1}
                        value={form.backoff_base}
                        onChange={(e) => set('backoff_base', e.target.value)}
                        hint="Initial waiting time before first retry attempt"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Review & Submit */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-slate-100">4. Review & Confirm Submission</h2>
                    <p className="text-xs text-slate-500">Verify all parameters and payload structure before creating the job.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                    <div className="space-y-2">
                      <p className="text-slate-500"><strong className="text-slate-300">Name:</strong> {form.name}</p>
                      <p className="text-slate-500"><strong className="text-slate-300">Queue:</strong> {queuesList.find((q) => q.id === form.queue_id)?.name ?? form.queue_id}</p>
                      <p className="text-slate-500"><strong className="text-slate-300">Priority:</strong> {form.priority} ({form.priority >= 100 ? 'Critical' : form.priority >= 10 ? 'High' : 'Normal'})</p>
                      <p className="text-slate-500"><strong className="text-slate-300">Max Retries:</strong> {form.max_retries} attempts</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-500"><strong className="text-slate-300">Timeout:</strong> {form.timeout_seconds} seconds</p>
                      <p className="text-slate-500"><strong className="text-slate-300">Trigger Mode:</strong> {form.schedule_type.toUpperCase()}</p>
                      {form.schedule_type === 'cron' && <p className="text-slate-500"><strong className="text-indigo-400">Cron:</strong> {form.cron_expression}</p>}
                      {form.schedule_type === 'delayed' && <p className="text-slate-500"><strong className="text-indigo-400">Run At:</strong> {form.run_at}</p>}
                      <p className="text-slate-500"><strong className="text-slate-300">Backoff:</strong> {form.backoff_strategy} (base {form.backoff_base}s)</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Code className="size-3.5 text-emerald-400" /> Final Payload Preview (JSON)
                    </p>
                    <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto max-h-60 text-xs font-mono text-emerald-300 shadow-inner">
                      {tryParseJson(form.payload)}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <div className="flex justify-between items-center px-6 py-4 bg-slate-900/90 border-t border-slate-800">
          <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="sm" iconRight={ChevronRight} onClick={next}>
              Continue to {STEPS[step + 1]}
            </Button>
          ) : (
            <Button variant="primary" size="sm" loading={createMut.isPending} onClick={submit}>
              Create & Dispatch Job
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function tryParseJson(str) {
  try {
    return prettyJson(JSON.parse(str))
  } catch {
    return str
  }
}
