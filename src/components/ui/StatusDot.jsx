import clsx from 'clsx'

const statusConfig = {
  online:  { dot: 'bg-success',  text: 'text-success',  ring: 'bg-success/20'  },
  offline: { dot: 'bg-danger',   text: 'text-danger',   ring: 'bg-danger/20'   },
  warning: { dot: 'bg-warning',  text: 'text-warning',  ring: 'bg-warning/20'  },
  unknown: { dot: 'bg-muted',    text: 'text-muted',    ring: 'bg-border'      },
}

/**
 * StatusDot — colored animated dot with optional label
 * Usage: <StatusDot status="online" label="Signal Server" />
 * status: "online" | "offline" | "warning" | "unknown"
 */
export default function StatusDot({ status = 'unknown', label, size = 'sm', showLabel = true, className }) {
  const cfg = statusConfig[status] ?? statusConfig.unknown

  const dotSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
  }

  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex shrink-0">
        {status === 'online' && (
          <span
            className={clsx(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              cfg.ring
            )}
          />
        )}
        <span className={clsx('relative inline-flex rounded-full', dotSizes[size] ?? dotSizes.sm, cfg.dot)} />
      </span>
      {showLabel && label && (
        <span className={clsx('text-xs font-medium', cfg.text)}>{label}</span>
      )}
    </span>
  )
}
