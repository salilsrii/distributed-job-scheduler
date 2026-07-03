import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}
const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-300',
  error:   'border-rose-500/30    bg-rose-950/80    text-rose-300',
  warning: 'border-amber-500/30   bg-amber-950/80   text-amber-300',
  info:    'border-indigo-500/30  bg-indigo-950/80  text-indigo-300',
}

export function Toast({ id, type = 'info', message, onRemove }) {
  const Icon = ICONS[type] ?? Info

  return (
    <div
      className={[
        'flex items-start gap-3 w-80 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl',
        'animate-[slideUp_0.3s_ease-out]',
        STYLES[type],
      ].join(' ')}
      role="alert"
    >
      <Icon className="size-4 shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  )
}
