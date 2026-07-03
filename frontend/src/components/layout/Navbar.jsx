import { Bell, Search, LogOut, User, Sparkles } from 'lucide-react'
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
    <header className="h-20 bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-8 shrink-0 sticky top-0 z-50 shadow-sm relative overflow-visible">
      {/* Animated Ambient Background Glow Orb wrapped in overflow-hidden container to prevent blur bleeding */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 blur-3xl animate-float" />
      </div>

      {/* Left — larger page title banner */}
      <div className="flex items-center gap-3.5 relative z-10">
        {title && (
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
              Pro
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Notification bell */}
        <button
          className="relative p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer"
            id="user-menu-btn"
            aria-haspopup="true"
            aria-expanded={dropOpen}
          >
            <span className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shadow-md shadow-indigo-500/20 border border-white/10 shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
            <span className="hidden sm:block max-w-[140px] truncate">{user?.name ?? user?.email ?? 'User'}</span>
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-full mt-3.5 w-56 max-w-[calc(100vw-32px)] bg-[#0B0F19]/95 backdrop-blur-xl border border-slate-700/80 rounded-[20px] shadow-2xl shadow-indigo-500/20 z-[9999] p-2.5 animate-dropdown">
                <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1.5">
                  <p className="text-xs font-bold text-slate-200 truncate">{user?.name ?? 'User'}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <DropItem icon={User} label="Account Settings" onClick={() => { navigate(ROUTES.SETTINGS); setDropOpen(false) }} />
                <div className="my-1.5 border-t border-slate-800/80" />
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
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
        danger
          ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
      ].join(' ')}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}
