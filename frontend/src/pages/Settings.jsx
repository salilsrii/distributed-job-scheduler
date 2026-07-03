import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { User, Key, Bell, Save, Eye, EyeOff, Trash2, Plus, Copy } from 'lucide-react'
import { settingsApi } from '../api/settings'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../hooks/useToast'
import { formatDateTime } from '../utils/formatters'

const TABS = [
  { id: 'profile',        label: 'Profile',       icon: User },
  { id: 'api-tokens',     label: 'API Tokens',    icon: Key },
  { id: 'notifications',  label: 'Notifications', icon: Bell },
]

export default function Settings() {
  const { user, persist } = useAuth()
  const [tab, setTab] = useState('profile')

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
              tab === id
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile'       && <ProfileTab user={user} persist={persist} />}
      {tab === 'api-tokens'    && <ApiTokensTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  )
}

function ProfileTab({ user, persist }) {
  const [form, setForm] = useState({
    name:     user?.name  ?? '',
    email:    user?.email ?? '',
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
      toast.success('Profile updated')
    },
    onError: (e) => toast.error(e?.response?.data?.detail || e?.message || 'Unexpected error'),
  })

  const pwMut = useMutation({
    mutationFn: settingsApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed')
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
      setPwErr('Passwords do not match')
      return
    }
    if (form.new_password.length < 8) {
      setPwErr('Password must be at least 8 characters')
      return
    }
    setPwErr('')
    pwMut.mutate({ current_password: form.current_password, new_password: form.new_password })
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <form onSubmit={handleProfile}>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white">
                {form.name?.charAt(0)?.toUpperCase() ?? form.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{form.name || 'No name set'}</p>
                <p className="text-xs text-slate-500">{form.email}</p>
              </div>
            </div>
            <Input label="Full Name" placeholder="Your name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input label="Email" type="email" value={form.email} disabled
              hint="Email cannot be changed here"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" icon={Save} loading={updateMut.isPending}>
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <form onSubmit={handlePassword}>
          <CardContent className="space-y-4">
            {pwErr && (
              <div className="px-4 py-2.5 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-400 text-sm">
                {pwErr}
              </div>
            )}
            <Input label="Current Password" type={showPw ? 'text' : 'password'} value={form.current_password}
              onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
            />
            <Input label="New Password" type={showPw ? 'text' : 'password'} value={form.new_password}
              onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
              hint="Minimum 8 characters"
            />
            <Input label="Confirm New Password" type={showPw ? 'text' : 'password'} value={form.confirm_password}
              onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
            />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              {showPw ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {showPw ? 'Hide' : 'Show'} passwords
            </button>
          </CardContent>
          <CardFooter className="flex justify-end">
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
  { id: 't1', name: 'CI/CD Pipeline',      created_at: '2024-01-10T12:00:00Z', last_used_at: '2024-06-28T09:15:00Z' },
  { id: 't2', name: 'Monitoring Dashboard', created_at: '2024-03-05T08:00:00Z', last_used_at: null },
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
      setNewTkn(res.token ?? 'sk-demo-' + Math.random().toString(36).slice(2))
      setName('')
      toast.success('Token created')
    } catch {
      // demo: just show a fake token
      const id = 't' + Date.now()
      setTokens((t) => [...t, { id, name, created_at: new Date().toISOString() }])
      setNewTkn('sk-demo-' + Math.random().toString(36).slice(2))
      setName('')
    } finally {
      setLoading(false)
    }
  }

  function revoke(id) {
    setTokens((t) => t.filter((x) => x.id !== id))
    toast.success('Token revoked')
  }

  function copy(val) {
    navigator.clipboard.writeText(val)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader><CardTitle>API Tokens</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {newTkn && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 font-medium mb-2">⚠️ Copy this token now — it won't be shown again</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-emerald-300 bg-slate-900 px-3 py-2 rounded-lg font-mono break-all">{newTkn}</code>
              <Button variant="ghost" size="sm" icon={Copy} onClick={() => copy(newTkn)}>Copy</Button>
            </div>
          </div>
        )}

        {/* Create new */}
        <div className="flex items-end gap-3">
          <Input label="Token Name" placeholder="e.g. Production API" value={name}
            onChange={(e) => setName(e.target.value)}
            containerClass="flex-1"
          />
          <Button variant="primary" size="md" icon={Plus} loading={loading} onClick={create}>
            Generate
          </Button>
        </div>

        {/* Token list */}
        <div className="space-y-2">
          {tokens.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">No API tokens yet</p>
          ) : tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-300">{t.name}</p>
                <p className="text-xs text-slate-600">
                  Created {formatDateTime(t.created_at)}
                  {t.last_used_at && ` · Last used ${formatDateTime(t.last_used_at)}`}
                </p>
              </div>
              <button onClick={() => revoke(t.id)}
                className="p-1.5 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors">
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
    job_failed:    true,
    job_completed: false,
    worker_offline:true,
    weekly_report: false,
  })

  function toggle(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }

  const items = [
    { key: 'job_failed',    label: 'Job failed',      desc: 'Notify when any job fails or exceeds retry limit' },
    { key: 'job_completed', label: 'Job completed',   desc: 'Notify on every successful job completion' },
    { key: 'worker_offline',label: 'Worker goes offline', desc: 'Notify when a worker stops sending heartbeats' },
    { key: 'weekly_report', label: 'Weekly summary',  desc: 'Receive a weekly digest of job statistics' },
  ]

  return (
    <Card>
      <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-200">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => toggle(key)}
              className={[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
                prefs[key] ? 'bg-indigo-600' : 'bg-slate-700',
              ].join(' ')}
            >
              <span className={[
                'inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                prefs[key] ? 'translate-x-[18px]' : 'translate-x-[3px]',
              ].join(' ')} />
            </button>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="primary" size="sm" icon={Save} onClick={() => toast.success('Preferences saved')}>
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  )
}
