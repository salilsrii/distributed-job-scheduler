import { forwardRef } from 'react'

const VARIANTS = {
  primary:   'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 border border-indigo-500/50',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
  danger:    'bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/50',
  ghost:     'hover:bg-slate-800 text-slate-400 hover:text-slate-200',
  outline:   'border border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-150 cursor-pointer select-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="size-4 shrink-0" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="size-4 shrink-0" />}
    </button>
  )
})
