import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead>
      <tr className="border-b border-slate-800 bg-slate-900/80">
        {children}
      </tr>
    </thead>
  )
}

export function Th({ children, className = '', sortable, sorted, onClick }) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={[
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
        sortable ? 'cursor-pointer hover:text-slate-300 select-none' : '',
        className,
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className={sorted ? 'text-indigo-400' : 'text-slate-700'}>
            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </span>
    </th>
  )
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-slate-300 ${className}`}>{children}</td>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-slate-800/80">{children}</tbody>
}

export function EmptyRow({ cols, message = 'No data found' }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-16 text-center text-sm text-slate-600">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">📭</span>
          {message}
        </div>
      </td>
    </tr>
  )
}

export function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
      <p className="text-xs text-slate-500">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPage(1)}       disabled={page === 1}          icon={ChevronsLeft} label="First" />
        <PagBtn onClick={() => onPage(page - 1)} disabled={page === 1}         icon={ChevronLeft}  label="Prev" />
        <span className="px-3 py-1.5 text-xs font-medium text-slate-400">
          {page} / {totalPages}
        </span>
        <PagBtn onClick={() => onPage(page + 1)} disabled={page === totalPages} icon={ChevronRight}  label="Next" />
        <PagBtn onClick={() => onPage(totalPages)} disabled={page === totalPages} icon={ChevronsRight} label="Last" />
      </div>
    </div>
  )
}

function PagBtn({ onClick, disabled, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <Icon className="size-3.5" />
    </button>
  )
}
