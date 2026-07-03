import { Bell, Search, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'

export function Navbar({ title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      {/* Left — page title injected via prop or current route */}
      <div className="flex items-center gap-3">
        {title && <h1 className="text-lg font-semibold text-slate-100">{title}</h1>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notification bell (placeholder) */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-indigo-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            id="user-menu-btn"
            aria-haspopup="true"
            aria-expanded={dropOpen}
          >
            <span className="size-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
            <span className="hidden sm:block max-w-[120px] truncate">{user?.name ?? user?.email ?? 'User'}</span>
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 animate-[fadeIn_0.15s_ease-out]">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-medium text-slate-300 truncate">{user?.name ?? 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <DropItem icon={User} label="Settings" onClick={() => { navigate(ROUTES.SETTINGS); setDropOpen(false) }} />
                <DropItem icon={LogOut} label="Sign out" onClick={handleLogout} danger />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function DropItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-rose-400 hover:bg-rose-950/40'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
      ].join(' ')}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
