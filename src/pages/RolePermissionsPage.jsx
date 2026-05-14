import { useState, useEffect } from 'react'
import { Shield, Lock, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import { rolesApi } from '../api/users'
import Button from '../components/ui/Button'

// ── Inline AccessDenied ────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="h-16 w-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <Shield size={28} className="text-danger" />
      </div>
      <h2 className="text-xl font-bold text-text">Access Denied</h2>
      <p className="text-sm text-muted mt-2 max-w-xs">
        You don't have permission to view this page.
      </p>
    </div>
  )
}

// ── Collapsible permission group ───────────────────────────────
function PermissionGroup({ groupName, permKeys, roles, editableRoleIds, selectedPerms, onToggle }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border text-left group"
      >
        {expanded
          ? <ChevronDown size={14} className="text-muted shrink-0" />
          : <ChevronRight size={14} className="text-muted shrink-0" />
        }
        <span className="text-xs font-semibold text-text uppercase tracking-widest">
          {groupName.replace(/_/g, ' ')}
        </span>
      </button>

      {expanded && permKeys.map((key) => (
        <div
          key={key}
          className="grid border-b border-border last:border-0"
          style={{ gridTemplateColumns: `1fr repeat(${roles.length}, 80px)` }}
        >
          {/* Permission label */}
          <div className="px-6 py-2.5 flex items-center">
            <span className="text-xs text-muted font-mono">{key}</span>
          </div>

          {/* Checkbox per role */}
          {roles.map((role) => {
            const isAdmin    = role.name?.toLowerCase() === 'admin'
            const isEditable = editableRoleIds.includes(role.id) && !isAdmin
            const checked    = isAdmin || (selectedPerms[role.id] ?? new Set()).has(key)

            return (
              <div key={role.id} className="flex items-center justify-center py-2.5">
                {isAdmin ? (
                  <span className="text-success" title="Admin always has all permissions">
                    <Lock size={13} />
                  </span>
                ) : (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!isEditable}
                    onChange={() => onToggle(role.id, key)}
                    className={clsx(
                      'h-4 w-4 rounded border-border accent-accent cursor-pointer',
                      !isEditable && 'opacity-40 cursor-not-allowed'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function RolePermissionsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission('roles.view')) return <AccessDenied />

  return <RolePermissionsInner />
}

function RolePermissionsInner() {
  const [roles, setRoles]                   = useState([])
  const [groups, setGroups]                 = useState({})       // { groupName: [permKey] }
  const [selectedPerms, setSelectedPerms]   = useState({})       // { roleId: Set<string> }
  const [activeTab, setActiveTab]           = useState(null)
  const [saving, setSaving]                 = useState({})       // { roleId: bool }
  const [saveStatus, setSaveStatus]         = useState({})       // { roleId: 'ok'|'error' }
  const [loading, setLoading]               = useState(true)
  const [apiError, setApiError]             = useState('')

  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canEdit = hasPermission('roles.edit') || hasPermission('roles.update')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [rolesData, permsData] = await Promise.all([
        rolesApi.list(),
        rolesApi.allPermissions(),
      ])
      setRoles(rolesData)
      setGroups(permsData.groups ?? {})

      // Build initial selected perms map: { roleId: Set<permKey> }
      const map = {}
      for (const role of rolesData) {
        map[role.id] = new Set(role.permissions ?? [])
      }
      setSelectedPerms(map)

      if (rolesData.length) setActiveTab(rolesData[0].id)
      setLoading(false)
    }
    load()
  }, [])

  const handleToggle = (roleId, key) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev[roleId] ?? [])
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...prev, [roleId]: next }
    })
  }

  const handleSave = async (roleId) => {
    setSaving((s) => ({ ...s, [roleId]: true }))
    setSaveStatus((s) => ({ ...s, [roleId]: null }))
    try {
      const permissions = Array.from(selectedPerms[roleId] ?? [])
      await rolesApi.updatePerms(roleId, permissions)
      setSaveStatus((s) => ({ ...s, [roleId]: 'ok' }))
      setTimeout(() => setSaveStatus((s) => ({ ...s, [roleId]: null })), 2500)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to save permissions.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setSaveStatus((s) => ({ ...s, [roleId]: 'error' }))
    } finally {
      setSaving((s) => ({ ...s, [roleId]: false }))
    }
  }

  const editableRoleIds = roles
    .filter((r) => r.name?.toLowerCase() !== 'admin')
    .map((r) => r.id)

  const activeRole = roles.find((r) => r.id === activeTab)
  const isAdmin    = activeRole?.name?.toLowerCase() === 'admin'

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 rounded-lg bg-surface animate-pulse" />
        <div className="h-96 rounded-xl bg-surface animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Role Permissions</h1>
        <p className="text-sm text-muted mt-0.5">
          Control what each role can access across the platform.
        </p>
      </div>

      {apiError && (
        <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {apiError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveTab(role.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === role.id
                ? 'text-accent'
                : 'text-muted hover:text-text'
            )}
          >
            {role.display_name || role.name}
            {activeTab === role.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Admin notice */}
      {isAdmin && (
        <div className="flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3">
          <Lock size={15} className="text-warning shrink-0" />
          <p className="text-sm text-warning">
            Admin always has all permissions. These cannot be modified.
          </p>
        </div>
      )}

      {/* Permission grid */}
      <div className="bg-bg border border-border rounded-xl overflow-hidden">
        {/* Column headers */}
        <div
          className="grid bg-surface border-b border-border"
          style={{ gridTemplateColumns: `1fr repeat(${roles.length}, 80px)` }}
        >
          <div className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
            Permission
          </div>
          {roles.map((role) => (
            <div
              key={role.id}
              className={clsx(
                'py-3 text-xs font-semibold uppercase tracking-wider text-center',
                activeTab === role.id ? 'text-accent' : 'text-muted'
              )}
            >
              {role.display_name || role.name}
            </div>
          ))}
        </div>

        {/* Groups */}
        {Object.entries(groups).map(([groupName, permKeys]) => (
          <PermissionGroup
            key={groupName}
            groupName={groupName}
            permKeys={permKeys}
            roles={roles}
            editableRoleIds={canEdit ? editableRoleIds : []}
            selectedPerms={selectedPerms}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Save buttons */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {roles
            .filter((r) => r.name?.toLowerCase() !== 'admin')
            .map((role) => {
              const ok    = saveStatus[role.id] === 'ok'
              const error = saveStatus[role.id] === 'error'
              return (
                <div key={role.id} className="flex items-center gap-2">
                  {ok && <span className="text-xs text-success">Saved!</span>}
                  {error && <span className="text-xs text-danger">Error saving</span>}
                  <Button
                    variant={ok ? 'secondary' : 'primary'}
                    size="sm"
                    loading={saving[role.id]}
                    onClick={() => handleSave(role.id)}
                  >
                    Save {role.display_name || role.name}
                  </Button>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
