import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { jobsApi } from '../api/jobs'
import { queuesApi } from '../api/queues'
import { Button } from '../components/ui/Button'
import { Input, Textarea, Select } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { ROUTES, BACKOFF_STRATEGIES } from '../utils/constants'
import { toast } from '../hooks/useToast'
import { prettyJson } from '../utils/formatters'

const STEPS = ['Basic Info', 'Payload', 'Scheduling', 'Review']

const DEFAULT_FORM = {
  name: '',
  description: '',
  queue_id: '',
  priority: 0,
  max_retries: 3,
  timeout_seconds: 300,
  payload: '{}',
  // retry policy
  backoff_strategy: 'exponential',
  backoff_base: 30,
  // scheduling
  cron_expression: '',
  run_at: '',
}

function StepIndicator({ current }) {
  return (
    <nav className="flex items-center gap-2 mb-8" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center size-8 rounded-full text-xs font-semibold border-2 transition-all duration-200 ${
              done   ? 'bg-indigo-600 border-indigo-600 text-white'
              : active ? 'bg-transparent border-indigo-500 text-indigo-400'
              : 'bg-transparent border-slate-700 text-slate-600'
            }`}>
              {done ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${active ? 'text-slate-200' : done ? 'text-indigo-400' : 'text-slate-600'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 transition-colors ${i < current ? 'bg-indigo-600' : 'bg-slate-800'}`} />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function CreateJob() {
  const navigate = useNavigate()
  const [step,     setStep]     = useState(0)
  const [form,     setForm]     = useState(DEFAULT_FORM)
  const [errors,   setErrors]   = useState({})
  const [jsonErr,  setJsonErr]  = useState('')

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
  const queues = queuesQ.data?.items ?? []

  const createMut = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (data) => {
      toast.success('Job created successfully!')
      navigate(ROUTES.JOBS)
    },
    onError: (e) => toast.error(e.message),
  })

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateStep0() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.queue_id)    e.queue_id = 'Select a queue'
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
      setJsonErr(`Invalid JSON: ${e.message}`)
      return false
    }
  }

  function next() {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    setStep((s) => s + 1)
  }
  function back() { setStep((s) => s - 1) }

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
      ...(form.cron_expression && { cron_expression: form.cron_expression }),
      ...(form.run_at           && { run_at: form.run_at }),
    }
    createMut.mutate(body)
  }

  const queueOptions = queues.map((q) => ({ value: q.id, label: q.name }))

  return (
    <div className="max-w-2xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      <StepIndicator current={step} />

      <Card>
        <CardContent className="py-6">
          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-100">Job Information</h2>
              <Input label="Job Name" placeholder="e.g. send-weekly-digest" required
                value={form.name} error={errors.name}
                onChange={(e) => set('name', e.target.value)}
              />
              <Textarea label="Description" placeholder="What does this job do?" rows={2}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
              <Select label="Queue" placeholder="Select a queue…" required
                options={queueOptions}
                value={form.queue_id} error={errors.queue_id}
                onChange={(e) => set('queue_id', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input label="Priority" type="number" min={0} max={100}
                  value={form.priority}
                  onChange={(e) => set('priority', e.target.value)}
                  hint="0=normal, 100=critical"
                />
                <Input label="Max Retries" type="number" min={0} max={20}
                  value={form.max_retries}
                  onChange={(e) => set('max_retries', e.target.value)}
                />
                <Input label="Timeout (s)" type="number" min={1}
                  value={form.timeout_seconds} error={errors.timeout_seconds}
                  onChange={(e) => set('timeout_seconds', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1 — Payload */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-100">Job Payload</h2>
              <p className="text-sm text-slate-500">JSON object that will be passed to your worker function.</p>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Payload (JSON)</label>
                <textarea
                  rows={14}
                  className={`json-editor w-full rounded-lg bg-slate-800 border text-slate-100 text-sm px-3 py-2 focus:outline-none transition-colors resize-none ${jsonErr ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                  value={form.payload}
                  onChange={(e) => { set('payload', e.target.value); setJsonErr('') }}
                  spellCheck={false}
                />
                {jsonErr && <p className="mt-1 text-xs text-rose-400">{jsonErr}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                try {
                  set('payload', prettyJson(JSON.parse(form.payload)))
                } catch {}
              }}>Format JSON</Button>
            </div>
          )}

          {/* Step 2 — Scheduling */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">Scheduling & Retry</h2>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Schedule (optional)</h3>
                <Input label="Cron Expression" placeholder="e.g. 0 9 * * 1 (every Mon 9am)"
                  value={form.cron_expression}
                  onChange={(e) => set('cron_expression', e.target.value)}
                  hint="Leave blank for immediate one-time execution"
                />
                <Input label="Run At (one-time)" type="datetime-local"
                  value={form.run_at}
                  onChange={(e) => set('run_at', e.target.value)}
                  hint="Overrides cron if both provided"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Retry Policy</h3>
                <Select label="Backoff Strategy"
                  options={BACKOFF_STRATEGIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                  value={form.backoff_strategy}
                  onChange={(e) => set('backoff_strategy', e.target.value)}
                />
                <Input label="Base Backoff (s)" type="number" min={1}
                  value={form.backoff_base}
                  onChange={(e) => set('backoff_base', e.target.value)}
                  hint="Initial delay before first retry"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-100">Review & Submit</h2>
              <div className="space-y-3">
                {[
                  ['Name',        form.name],
                  ['Description', form.description || '—'],
                  ['Queue',       queues.find((q) => q.id === form.queue_id)?.name ?? form.queue_id],
                  ['Priority',    form.priority],
                  ['Max Retries', form.max_retries],
                  ['Timeout',     `${form.timeout_seconds}s`],
                  ['Cron',        form.cron_expression || 'Immediate'],
                  ['Run At',      form.run_at || '—'],
                  ['Backoff',     `${form.backoff_strategy} (base ${form.backoff_base}s)`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm text-slate-200 font-medium max-w-xs truncate">{val}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Payload preview:</p>
                <pre className="json-editor text-xs bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-auto max-h-40 text-emerald-400">
                  {prettyJson(JSON.parse(form.payload))}
                </pre>
              </div>
            </div>
          )}
        </CardContent>

        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="sm" iconRight={ChevronRight} onClick={next}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" size="sm" loading={createMut.isPending} onClick={submit}>
              Create Job
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
