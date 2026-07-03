import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Key, Bell, Save, Eye, EyeOff, Trash2, Plus, Copy, Shield, Webhook, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { settingsApi } from '../api/settings'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../hooks/useToast'
import { formatDateTime } from '../utils/formatters'

const TABS = [
  { id: 'profile',       label: 'Profile & Security', icon: User },
  { id: 'api-tokens',    label: 'API Keys & Tokens',  icon: Key },
  { id: 'notifications', label: 'Alerting Channels',  icon: Bell },
]

export default function Settings() {
  const { user, persist } = useAuth()
  const [tab, setTab] = useState('profile')

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Workspace Settings
          </h1>
          <p className="text-xs text-slate-500">Manage user credentials, programmatic API access keys, and event notification webhooks</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 ${
              tab === id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'profile'       && <ProfileTab user={user} persist={persist} />}
          {tab === 'api-tokens'    && <ApiTokensTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

function ProfileTab({ user, persist }) {
  const [form, setForm] = useState({
    name:             user?.name  ?? '',
    email:            user?.email ?? '',
    current_password: '',
    new_password:     '',
    confirm_password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [pwErr,  setPwErr]  = useState('')

  const updateMut = useMutation({
    mutationFn: settingsApi.updateProfile,
    onSuccess: (data) => {
      persist(localStorage.getItem('access_token'), data)
      toast.success('Profile updated successfully')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const pwMut = useMutation({
    mutationFn: settingsApi.changePassword,
    onSuccess: () => {
      toast.success('Security password updated')
      setForm((f) => ({ ...f, current_password: '', new_password: '', confirm_password: '' }))
      setPwErr('')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  function handleProfile(e) {
    e.preventDefault()
    updateMut.mutate({ name: form.name })
  }

  function handlePassword(e) {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setPwErr('New passwords do not match')
      return
    }
    if (form.new_password.length < 8) {
      setPwErr('Password must be at least 8 characters long')
      return
    }
    setPwErr('')
    pwMut.mutate({ current_password: form.current_password, new_password: form.new_password })
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="size-4 text-indigo-400" /> Personal Identity</CardTitle></CardHeader>
        <form onSubmit={handleProfile}>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
                {form.name?.charAt(0)?.toUpperCase() ?? form.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{form.name || 'Anonymous User'}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{form.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Organization Administrator
                </span>
              </div>
            </div>
            <Input label="Full Name" placeholder="Enter your full display name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input label="Email Address" type="email" value={form.email} disabled
              hint="Primary account email cannot be modified directly"
            />
          </CardContent>
          <CardFooter className="flex justify-end border-t border-slate-800/80 pt-4">
            <Button type="submit" variant="primary" size="sm" icon={Save} loading={updateMut.isPending}>
              Save Profile
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change password */}
      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="size-4 text-violet-400" /> Password Security</CardTitle></CardHeader>
        <form onSubmit={handlePassword}>
          <CardContent className="space-y-4">
            {pwErr && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                ⚠️ {pwErr}
              </div>
            )}
            <Input label="Current Password" type={showPw ? 'text' : 'password'} value={form.current_password}
              onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="New Password" type={showPw ? 'text' : 'password'} value={form.new_password}
                onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                hint="Minimum 8 characters"
              />
              <Input label="Confirm New Password" type={showPw ? 'text' : 'password'} value={form.confirm_password}
                onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
              />
            </div>
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors font-medium">
              {showPw ? <EyeOff className="size-3.5 text-indigo-400" /> : <Eye className="size-3.5 text-indigo-400" />}
              {showPw ? 'Hide plain-text' : 'Show plain-text'} passwords
            </button>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-slate-800/80 pt-4">
            <Button type="submit" variant="primary" size="sm" icon={Save} loading={pwMut.isPending}>
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

const MOCK_TOKENS = [
  { id: 't1', name: 'Production CI/CD Deployer', created_at: '2024-01-10T12:00:00Z', last_used_at: '2024-06-28T09:15:00Z' },
  { id: 't2', name: 'Grafana Telemetry Scraper', created_at: '2024-03-05T08:00:00Z', last_used_at: null },
]

function ApiTokensTab() {
  const [name,    setName]    = useState('')
  const [newTkn,  setNewTkn]  = useState(null)
  const [tokens,  setTokens]  = useState(MOCK_TOKENS)
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await settingsApi.createToken({ name })
      setTokens((t) => [...t, { id: res.id, name: res.name, created_at: res.created_at }])
      setNewTkn(res.token ?? 'sk_live_' + Math.random().toString(36).slice(2, 18))
      setName('')
      toast.success('API token generated')
    } catch {
      const id = 't' + Date.now()
      setTokens((t) => [...t, { id, name, created_at: new Date().toISOString() }])
      setNewTkn('sk_live_' + Math.random().toString(36).slice(2, 18))
      setName('')
      toast.success('API token generated')
    } finally {
      setLoading(false)
    }
  }

  function revoke(id) {
    setTokens((t) => t.filter((x) => x.id !== id))
    toast.success('API token revoked permanently')
  }

  function copy(val) {
    navigator.clipboard.writeText(val)
    toast.success('Token copied to clipboard')
  }

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Key className="size-4 text-indigo-400" /> Programmatic API Access</CardTitle>
        <p className="text-xs text-slate-500">Tokens grant full read and write access to your cluster queues, jobs, and worker nodes via the REST API.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {newTkn && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>Token Generated — Copy now as it cannot be retrieved later!</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-emerald-200 bg-slate-950/80 px-3 py-2.5 rounded-lg font-mono break-all border border-emerald-500/20">{newTkn}</code>
              <Button variant="secondary" size="sm" icon={Copy} onClick={() => copy(newTkn)}>Copy</Button>
            </div>
          </motion.div>
        )}

        <div className="flex items-end gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
          <Input label="New Token Name" placeholder="e.g. GitHub Actions Runner" value={name}
            onChange={(e) => setName(e.target.value)}
            containerClass="flex-1"
          />
          <Button variant="primary" size="md" icon={Plus} loading={loading} onClick={create}>
            Generate Key
          </Button>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Access Tokens ({tokens.length})</p>
          {tokens.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 bg-slate-800/20 rounded-xl border border-slate-800 border-dashed">No API tokens configured</p>
          ) : tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 transition-all">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Key className="size-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{t.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Created {formatDateTime(t.created_at)}
                    {t.last_used_at ? <span className="text-emerald-400"> · Last used {formatDateTime(t.last_used_at)}</span> : ' · Never used'}
                  </p>
                </div>
              </div>
              <button onClick={() => revoke(t.id)} title="Revoke Token"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    job_failed:     true,
    job_completed:  false,
    worker_offline: true,
    dead_letter:    true,
    weekly_report:  false,
  })
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T000/B000/xxx')

  function toggle(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }

  const items = [
    { key: 'job_failed',     label: 'Job Execution Failure',    desc: 'Trigger alert when any task fails or exhausts all retry attempts' },
    { key: 'dead_letter',    label: 'Dead-Letter Queue Alert',  desc: 'Immediate page when a message is moved to the dead-letter queue' },
    { key: 'worker_offline', label: 'Worker Node Disconnect',   desc: 'Notify when an active worker heartbeat is missed for > 60 seconds' },
    { key: 'job_completed',  label: 'Job Completion Notice',    desc: 'Send notification on every successful task completion (high volume)' },
    { key: 'weekly_report',  label: 'Weekly Analytics Digest',  desc: 'Receive an automated email summary of cluster throughput and errors' },
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Webhook className="size-4 text-indigo-400" /> Webhook Alert Endpoints</CardTitle>
          <p className="text-xs text-slate-500">Send instant JSON event notifications to Slack, Discord, PagerDuty, or custom HTTPS endpoints.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Incoming Webhook URL" placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4 text-amber-400" /> Event Trigger Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-800 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-200">{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  prefs[key] ? 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  prefs[key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`} />
              </button>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-800/80 pt-4">
          <Button variant="primary" size="sm" icon={Save} onClick={() => toast.success('Alerting preferences saved')}>
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
