export function Spinner({ size = 'md', className = '' }) {
  const SIZES = { xs: 'size-3', sm: 'size-4', md: 'size-5', lg: 'size-8', xl: 'size-12' }
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin ${SIZES[size]} ${className}`}
    />
  )
}

export function LoadingOverlay({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-500">
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-8 w-24" />
      <div className="skeleton h-3 w-40" />
    </div>
  )
}
