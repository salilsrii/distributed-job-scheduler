import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ToastContainer } from './components/ui/Toast'
import { useToastState } from './hooks/useToast'

import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Projects   from './pages/Projects'
import Queues     from './pages/Queues'
import Jobs       from './pages/Jobs'
import CreateJob  from './pages/CreateJob'
import JobDetail  from './pages/JobDetail'
import Workers    from './pages/Workers'
import Settings   from './pages/Settings'

import { ROUTES } from './utils/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppWithToast() {
  const { toasts, remove } = useToastState()

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path={ROUTES.LOGIN} element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path={ROUTES.DASHBOARD}  element={<Dashboard />} />
            <Route path={ROUTES.PROJECTS}   element={<Projects />} />
            <Route path={ROUTES.QUEUES}     element={<Queues />} />
            <Route path={ROUTES.JOBS}       element={<Jobs />} />
            <Route path={ROUTES.JOB_CREATE} element={<CreateJob />} />
            <Route path={ROUTES.JOB_DETAIL} element={<JobDetail />} />
            <Route path={ROUTES.WORKERS}    element={<Workers />} />
            <Route path={ROUTES.SETTINGS}   element={<Settings />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppWithToast />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
