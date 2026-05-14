import clsx from 'clsx'

const variants = {
  success: 'bg-success/10 text-success border-success/20',
  danger:  'bg-danger/10  text-danger  border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  neutral: 'bg-surface     text-muted   border-border',
  blue:    'bg-accent/10  text-accent  border-accent/20',
}

export default function Badge({ children, variant = 'neutral', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
