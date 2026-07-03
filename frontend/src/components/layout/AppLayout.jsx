import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/projects':   'Projects',
  '/queues':     'Queues',
  '/jobs':       'Jobs',
  '/jobs/new':   'Create Job',
  '/workers':    'Workers',
  '/settings':   'Settings',
}

export function AppLayout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Distributed Job Scheduler'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
