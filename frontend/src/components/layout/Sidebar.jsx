import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  ListOrdered,
  Briefcase,
  Plus,
  Cpu,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { ROUTES } from '../../utils/constants'

const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD,  icon: LayoutDashboard, exact: true },
  { label: 'Projects',  to: ROUTES.PROJECTS,   icon: FolderKanban },
  { label: 'Queues',    to: ROUTES.QUEUES,      icon: ListOrdered },
  { label: 'Jobs',      to: ROUTES.JOBS,        icon: Briefcase },
  { label: 'Create Job',to: ROUTES.JOB_CREATE,  icon: Plus },
  { label: 'Workers',   to: ROUTES.WORKERS,     icon: Cpu },
]

const BOTTOM_ITEMS = [
  { label: 'Settings',  to: ROUTES.SETTINGS,   icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={[
        'relative flex flex-col h-screen bg-[#0B0F19] border-r border-slate-800/80',
        'transition-all duration-300 ease-in-out shrink-0 select-none z-20 shadow-xl',
        collapsed ? 'w-20' : 'w-64',
      ].join(' ')}
    >
      {/* Brand Logo Header */}
      <div className={`flex items-center gap-3 px-5 h-20 border-b border-slate-800/80 shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="size-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 border border-white/10 animate-pulse-glow">
          <Zap className="size-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-extrabold tracking-tight text-slate-100 truncate">JobScheduler</p>
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="text-[11px] font-medium text-slate-400 truncate tracking-wide uppercase">Enterprise Cluster</p>
          </div>
        )}
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 py-6 px-3.5 flex flex-col gap-2 overflow-y-auto no-scrollbar">
        <div className="space-y-1.5">
          {!collapsed && <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Platform</p>}
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom Section & Cluster Health Card */}
      <div className="p-3.5 border-t border-slate-800/80 flex flex-col gap-3 shrink-0 bg-slate-950/40">
        <div className="space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>

        {/* Futuristic Cluster Status Card */}
        {!collapsed ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-800/30 p-3.5 border border-slate-800/80 shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Cluster Health
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All worker nodes & background routing channels online.
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Cluster Health: 100% Online" />
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3.5 top-24 size-7 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-lg z-30 active:scale-95"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>
    </aside>
  )
}

function SidebarLink({ to, label, icon: Icon, collapsed, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      title={collapsed ? label : undefined}
      className={({ isActive }) => [
        'flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
        isActive
          ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent text-indigo-300 border-l-4 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] font-bold'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:translate-x-1 border-l-4 border-transparent',
        collapsed ? 'justify-center px-0 border-l-0' : '',
      ].join(' ')}
    >
      <Icon className="size-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}
