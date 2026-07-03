import { forwardRef } from 'react'

const VARIANTS = {
  primary:   'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-indigo-400/30',
  secondary: 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md shadow-black/20 hover:border-slate-600',
  danger:    'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 shadow-md shadow-rose-950/40 hover:text-rose-300',
  ghost:     'hover:bg-slate-800/80 text-slate-400 hover:text-slate-100',
  outline:   'border border-slate-700 hover:border-indigo-500/80 hover:bg-indigo-500/10 text-slate-300 hover:text-white',
}

const SIZES = {
  xs: 'h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold',
  sm: 'h-9 px-4 text-xs gap-1.5 rounded-xl font-bold tracking-wide uppercase',
  md: 'h-10 px-4.5 text-sm gap-2 rounded-xl font-bold',
  lg: 'h-11 px-6 text-sm gap-2.5 rounded-xl font-bold tracking-wide',
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
        'inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </button>
  )
})
