import Badge from './Badge'

const ROLE_CONFIG = {
  admin:     { variant: 'warning', label: 'Admin' },
  moderator: { variant: 'blue',    label: 'Moderator' },
  user:      { variant: 'neutral', label: 'User' },
}

/**
 * <RoleBadge role="admin" />      → gold/yellow badge
 * <RoleBadge role="moderator" />  → blue badge
 * <RoleBadge role="user" />       → neutral badge
 */
export default function RoleBadge({ role, className }) {
  const normalized = role?.toLowerCase() ?? 'user'
  const config = ROLE_CONFIG[normalized] ?? { variant: 'neutral', label: role ?? 'Unknown' }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
