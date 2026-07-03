import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className = '', containerClass = '', ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon className="size-4" />
          </span>
        )}
        <input
          ref={ref}
          className={[
            'w-full rounded-lg bg-slate-800 border text-slate-100 text-sm',
            'placeholder:text-slate-600 focus:outline-none transition-colors duration-150',
            'h-9 px-3',
            Icon ? 'pl-9' : '',
            error
              ? 'border-rose-500 focus:border-rose-400'
              : 'border-slate-700 focus:border-indigo-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', containerClass = '', ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={[
          'w-full rounded-lg bg-slate-800 border text-slate-100 text-sm',
          'placeholder:text-slate-600 focus:outline-none transition-colors duration-150',
          'px-3 py-2 resize-none',
          error
            ? 'border-rose-500 focus:border-rose-400'
            : 'border-slate-700 focus:border-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, className = '', containerClass = '', options = [], placeholder, ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={[
          'w-full rounded-lg bg-slate-800 border text-slate-100 text-sm',
          'focus:outline-none transition-colors duration-150',
          'h-9 px-3 cursor-pointer',
          error
            ? 'border-rose-500 focus:border-rose-400'
            : 'border-slate-700 focus:border-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})
