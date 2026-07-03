import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className = '', containerClass = '', ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
          {props.required && <span className="ml-1 text-rose-400">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon className="size-4" />
          </span>
        )}
        <input
          ref={ref}
          className={[
            'w-full rounded-xl bg-slate-950/80 border text-slate-100 text-sm font-medium shadow-inner',
            'placeholder:text-slate-600 focus:outline-none transition-all duration-200',
            'h-11 px-4',
            Icon ? 'pl-10' : '',
            error
              ? 'border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">⚠️ {error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', containerClass = '', ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
          {props.required && <span className="ml-1 text-rose-400">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={[
          'w-full rounded-xl bg-slate-950/80 border text-slate-100 text-sm font-medium shadow-inner',
          'placeholder:text-slate-600 focus:outline-none transition-all duration-200',
          'px-4 py-3 resize-none',
          error
            ? 'border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">⚠️ {error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, className = '', containerClass = '', options = [], placeholder, ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
          {props.required && <span className="ml-1 text-rose-400">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={[
          'w-full rounded-xl bg-slate-950/80 border text-slate-100 text-sm font-medium shadow-inner',
          'focus:outline-none transition-all duration-200',
          'h-11 px-4 cursor-pointer',
          error
            ? 'border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">⚠️ {error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})
