import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-slate-800/80 bg-[#0B0F19] shadow-xl">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead>
      <tr className="border-b border-slate-800/80 bg-slate-950/60 text-left">
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
        'px-6 py-4 text-left text-xs font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap transition-colors duration-150',
        sortable ? 'cursor-pointer hover:text-indigo-400 hover:bg-slate-800/40 select-none' : '',
        className,
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="text-slate-500 flex items-center">
            {sorted === 'asc' ? (
              <ArrowUp className="size-3.5 text-indigo-400 animate-bounce" />
            ) : sorted === 'desc' ? (
              <ArrowDown className="size-3.5 text-indigo-400 animate-bounce" />
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
    <td className={`px-6 py-4 text-sm font-medium text-slate-300 transition-colors ${className}`}>{children}</td>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-slate-800/80">{children}</tbody>
}

export function EmptyRow({ cols, message = 'No data found', icon: Icon, description = 'There are currently no records to display matching your criteria.', actionLabel, onAction }) {
  return (
    <tr>
      <td colSpan={cols} className="px-8 py-24 text-center">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-3.5">
          <div className="size-16 rounded-[20px] bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-1 shadow-2xl shadow-indigo-500/10 animate-float">
            {Icon ? <Icon className="size-8 text-indigo-400" /> : <span className="text-3xl">📭</span>}
          </div>
          <h4 className="text-lg font-extrabold text-white tracking-tight">{message}</h4>
          <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-sm">{description}</p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold tracking-wide uppercase transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 cursor-pointer"
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
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-medium">
      <div className="flex items-center gap-3 text-slate-400">
        <span>
          Showing <strong className="text-white font-bold">{from}–{to}</strong> of <strong className="text-white font-bold">{total}</strong> records
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3.5">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPage(1)
              }}
              className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <PagBtn onClick={() => onPage(1)}       disabled={page <= 1}          icon={ChevronsLeft} label="First Page" />
        <PagBtn onClick={() => onPage(page - 1)} disabled={page <= 1}         icon={ChevronLeft}  label="Previous Page" />
        <span className="px-3.5 py-1.5 text-xs font-bold text-slate-300 bg-slate-900 rounded-xl border border-slate-800/80 mx-1.5 shadow-sm">
          Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
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
      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm cursor-pointer"
    >
      <Icon className="size-4" />
    </button>
  )
}
