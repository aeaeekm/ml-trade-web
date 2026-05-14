import clsx from 'clsx'

export default function Card({ children, className, header, footer, noPadding }) {
  return (
    <div
      className={clsx(
        'bg-bg border border-border rounded-xl shadow-card',
        className
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          {typeof header === 'string' ? (
            <h3 className="text-sm font-semibold text-text">{header}</h3>
          ) : header}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-5')}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-border bg-surface rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  )
}
