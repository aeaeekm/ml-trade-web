import clsx from 'clsx'

export default function Input({
  label,
  error,
  hint,
  className,
  id,
  type = 'text',
  leftIcon,
  rightIcon,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={clsx(
            'w-full bg-bg border rounded-lg text-sm text-text placeholder:text-muted transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-border',
            leftIcon  ? 'pl-9'  : 'pl-3.5',
            rightIcon ? 'pr-9'  : 'pr-3.5',
            'py-2.5'
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
