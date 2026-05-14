import Badge from './Badge'

const STATUS_CONFIG = {
  active:   { variant: 'success', label: 'Active' },
  disabled: { variant: 'danger',  label: 'Disabled' },
  pending:  { variant: 'warning', label: 'Pending' },
}

/**
 * <UserStatusBadge status="active" />   → green badge
 * <UserStatusBadge status="disabled" /> → red badge
 * <UserStatusBadge status="pending" />  → yellow badge
 */
export default function UserStatusBadge({ status, className }) {
  const normalized = status?.toLowerCase() ?? 'pending'
  const config = STATUS_CONFIG[normalized] ?? { variant: 'neutral', label: status ?? 'Unknown' }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
