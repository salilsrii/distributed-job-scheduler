import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead>
      <tr className="border-b border-slate-800 bg-slate-900/90 text-left">
        {children}
      </tr>
    </thead>
  )
}

export function Th({ children, className = '', sortable = false, sorted = null, onClick }) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={[
        'px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap transition-colors duration-150',
        sortable ? 'cursor-pointer hover:text-indigo-400 hover:bg-slate-800/50 select-none' : '',
        className,
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="text-slate-500 flex items-center">
            {sorted === 'asc' ? (
              <ArrowUp className="size-3.5 text-indigo-400" />
            ) : sorted === 'desc' ? (
              <ArrowDown className="size-3.5 text-indigo-400" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        )}
      </span>
    </th>
  )
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-slate-300 ${className}`}>{children}</td>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-slate-800/70">{children}</tbody>
}

export function EmptyRow({ cols, message = 'No data found', icon: Icon, description = 'There are currently no records to display matching your criteria.', actionLabel, onAction }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-20 text-center">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto gap-3">
          <div className="size-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-1 shadow-inner">
            {Icon ? <Icon className="size-7 text-indigo-400/80" /> : <span className="text-3xl">📭</span>}
          </div>
          <h4 className="text-base font-semibold text-slate-200">{message}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function Pagination({ page, pageSize, total, onPage, onPageSizeChange, pageSizeOptions = [10, 20, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 border-t border-slate-800/80 bg-slate-900/60 text-xs">
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          Showing <strong className="text-slate-300 font-medium">{from}–{to}</strong> of <strong className="text-slate-300 font-medium">{total}</strong> records
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPage(1)
              }}
              className="h-7 px-2 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPage(1)}       disabled={page <= 1}          icon={ChevronsLeft} label="First Page" />
        <PagBtn onClick={() => onPage(page - 1)} disabled={page <= 1}         icon={ChevronLeft}  label="Previous Page" />
        <span className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 rounded-md border border-slate-800 mx-1">
          Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong>
        </span>
        <PagBtn onClick={() => onPage(page + 1)} disabled={page >= totalPages} icon={ChevronRight}  label="Next Page" />
        <PagBtn onClick={() => onPage(totalPages)} disabled={page >= totalPages} icon={ChevronsRight} label="Last Page" />
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
      title={label}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
    >
      <Icon className="size-4" />
    </button>
  )
}
