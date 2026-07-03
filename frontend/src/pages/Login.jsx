import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? ROUTES.DASHBOARD

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [globalErr, setGlobalErr] = useState('')

  function validate() {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalErr('')
    if (!validate()) return
    const { ok, error } = await login(form.email, form.password)
    if (ok) {
      navigate(from, { replace: true })
    } else {
      setGlobalErr(error ?? 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Zap className="size-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">JobScheduler</p>
              <p className="text-xs text-slate-500">Distributed Task Engine</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">Sign in to your workspace</p>

          {globalErr && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-400 text-sm">
              {globalErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@company.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
              icon={Mail}
              required
            />

            <div>
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                error={errors.password}
                icon={Lock}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="mt-1.5 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                {showPass ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {showPass ? 'Hide' : 'Show'} password
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              id="login-submit-btn"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            Distributed Job Scheduler © {new Date().getFullYear()}
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600">
            Demo: <span className="text-slate-500">admin@example.com / password</span>
          </p>
        </div>
      </div>
    </div>
  )
}
