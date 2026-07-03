import { NavLink, useLocation } from 'react-router-dom'
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
        'relative flex flex-col h-screen bg-slate-900 border-r border-slate-800',
        'transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60',
      ].join(' ')}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
          <Zap className="size-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-100 truncate">JobScheduler</p>
            <p className="text-xs text-slate-500 truncate">Distributed</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-4 px-2 border-t border-slate-800 flex flex-col gap-1">
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 size-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
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
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
        isActive
          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800 border border-transparent',
        collapsed ? 'justify-center' : '',
      ].join(' ')}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}
