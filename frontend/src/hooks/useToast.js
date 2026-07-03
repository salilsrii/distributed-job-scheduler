import { useState, useCallback, useEffect } from 'react'

let globalDispatch = null

export function useToastState() {
  const [toasts, setToasts] = useState([])

  const add = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, ...toast }])
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    globalDispatch = add
    return () => { globalDispatch = null }
  }, [add])

  return { toasts, add, remove }
}

// Call this outside React components (e.g. API error handlers)
export const toast = {
  success: (message, opts) => globalDispatch?.({ type: 'success', message, ...opts }),
  error:   (message, opts) => globalDispatch?.({ type: 'error',   message, ...opts }),
  info:    (message, opts) => globalDispatch?.({ type: 'info',    message, ...opts }),
  warning: (message, opts) => globalDispatch?.({ type: 'warning', message, ...opts }),
}
