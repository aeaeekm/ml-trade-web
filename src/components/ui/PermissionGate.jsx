import useAuthStore from '../../store/authStore'

/**
 * Renders children only if the current user has the required permission(s).
 *
 * Single permission:
 *   <PermissionGate permission="users.create"><Button>Add</Button></PermissionGate>
 *
 * Multiple permissions (any match by default):
 *   <PermissionGate permissions={["users.create", "users.edit"]} requireAll={false}>
 *     ...
 *   </PermissionGate>
 *
 * Optional fallback rendered when access is denied:
 *   <PermissionGate permission="users.delete" fallback={<span>No access</span>}>
 *     ...
 *   </PermissionGate>
 */
export default function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const keys = permissions ?? (permission ? [permission] : [])

  if (keys.length === 0) return children

  const granted = requireAll
    ? keys.every((k) => hasPermission(k))
    : keys.some((k) => hasPermission(k))

  return granted ? children : fallback
}
