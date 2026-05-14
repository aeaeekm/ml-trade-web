import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, Plus, MoreHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import { usersApi } from '../api/users'
import Button from '../components/ui/Button'
import PermissionGate from '../components/ui/PermissionGate'
import RoleBadge from '../components/ui/RoleBadge'
import UserStatusBadge from '../components/ui/UserStatusBadge'
import {
  Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty,
} from '../components/ui/Table'
import UserFormModal from '../components/features/UserFormModal'
import ResetPasswordModal from '../components/features/ResetPasswordModal'
import Select from '../components/ui/Select'

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

// ── Toast banner ───────────────────────────────────────────────
function SuccessBanner({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  if (!message) return null
  return (
    <div className="mb-4 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-4 text-success/60 hover:text-success transition-colors text-xs">
        ✕
      </button>
    </div>
  )
}

// ── Row kebab menu ─────────────────────────────────────────────
function RowMenu({ user, onEdit, onResetPw, onToggle, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const action = (fn) => () => { setOpen(false); fn() }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-bg border border-border rounded-xl shadow-lg z-30 py-1 overflow-hidden">
          <PermissionGate permissions={['users.edit', 'users.update']} requireAll={false}>
            <MenuBtn onClick={action(onEdit)}>Edit</MenuBtn>
          </PermissionGate>
          <PermissionGate permission="users.reset_password">
            <MenuBtn onClick={action(onResetPw)}>Reset Password</MenuBtn>
          </PermissionGate>
          <PermissionGate permissions={['users.edit', 'users.update']} requireAll={false}>
            <MenuBtn onClick={action(onToggle)}>
              {user.is_active ? 'Disable User' : 'Enable User'}
            </MenuBtn>
          </PermissionGate>
          <PermissionGate permission="users.delete">
            <div className="border-t border-border mt-1 pt-1">
              <MenuBtn danger onClick={action(onDelete)}>Delete</MenuBtn>
            </div>
          </PermissionGate>
        </div>
      )}
    </div>
  )
}

function MenuBtn({ children, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text hover:bg-surface'
      )}
    >
      {children}
    </button>
  )
}

// ── Pagination ─────────────────────────────────────────────────
function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1 && total === 0) return null

  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-xs text-muted">
        {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={clsx(
              'h-7 w-7 rounded-lg text-xs font-medium transition-colors',
              p === page
                ? 'bg-accent text-white'
                : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function formatLastLogin(val) {
  if (!val) return '—'
  const d = new Date(val)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60)         return 'Just now'
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7)  return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

const ROLE_FILTER_OPTIONS = [
  { value: '',          label: 'All Roles' },
  { value: 'admin',     label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'user',      label: 'User' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '',         label: 'All Statuses' },
  { value: 'active',   label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'pending',  label: 'Pending' },
]

const LIMIT = 20

// ── Main page ──────────────────────────────────────────────────
export default function UsersPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission('users.view')) return <AccessDenied />

  return <UsersPageInner />
}

function UsersPageInner() {
  const [users, setUsers]           = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [success, setSuccess]       = useState('')

  // Modals
  const [formOpen, setFormOpen]           = useState(false)
  const [editUser, setEditUser]           = useState(null)
  const [resetOpen, setResetOpen]         = useState(false)
  const [resetUser, setResetUser]         = useState(null)

  // Debounce search
  const searchTimer = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, roleFilter, statusFilter])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = { page, limit: LIMIT }
    if (debouncedSearch) params.search = debouncedSearch
    if (roleFilter)      params.role   = roleFilter
    if (statusFilter)    params.status = statusFilter
    const data = await usersApi.list(params)
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, debouncedSearch, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Actions ──────────────────────────────────────────────────
  const openCreate = () => { setEditUser(null); setFormOpen(true) }
  const openEdit   = (u) => { setEditUser(u);   setFormOpen(true) }
  const openReset  = (u) => { setResetUser(u);  setResetOpen(true) }

  const handleToggleStatus = async (u) => {
    try {
      await usersApi.toggleStatus(u.id)
      setSuccess(`User ${u.email} status updated.`)
      fetchUsers()
    } catch {
      // silently fail
    }
  }

  const handleDelete = async (u) => {
    const confirmed = window.confirm(`Delete user "${u.email}"? This action cannot be undone.`)
    if (!confirmed) return
    try {
      await usersApi.delete(u.id)
      setSuccess(`User ${u.email} deleted.`)
      fetchUsers()
    } catch {
      // silently fail
    }
  }

  const handleFormSuccess = () => {
    setSuccess(editUser ? 'User updated successfully.' : 'User created successfully.')
    fetchUsers()
  }

  const handleResetSuccess = () => {
    setSuccess(`Password reset for ${resetUser?.email}.`)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text">User Management</h1>
          <p className="text-sm text-muted mt-0.5">Manage platform users, roles, and access.</p>
        </div>
        <PermissionGate permission="users.create">
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={openCreate}
          >
            Add User
          </Button>
        </PermissionGate>
      </div>

      {/* Success banner */}
      <SuccessBanner message={success} onDismiss={() => setSuccess('')} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg text-sm text-text placeholder:text-muted
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                       pl-9 pr-3.5 py-2.5 transition-colors"
          />
        </div>
        <Select
          options={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-40"
        />
        <Select
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th>User</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Last Login</Th>
            <Th className="w-12" />
          </tr>
        </Thead>
        {loading ? (
          <TableSkeleton cols={6} rows={8} />
        ) : users.length === 0 ? (
          <TableEmpty cols={6} message="No users found." />
        ) : (
          <Tbody>
            {users.map((u) => (
              <Tr key={u.id} onClick={() => openEdit(u)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-accent">
                        {(u.full_name || u.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {u.full_name || u.username || '—'}
                      </p>
                      {u.username && u.full_name && (
                        <p className="text-xs text-muted truncate">@{u.username}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td muted>{u.email}</Td>
                <Td>
                  <RoleBadge role={u.role_name} />
                </Td>
                <Td>
                  <UserStatusBadge status={u.status} />
                </Td>
                <Td muted>{formatLastLogin(u.last_login_at)}</Td>
                <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    user={u}
                    onEdit={() => openEdit(u)}
                    onResetPw={() => openReset(u)}
                    onToggle={() => handleToggleStatus(u)}
                    onDelete={() => handleDelete(u)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        )}
      </Table>

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      {/* Modals */}
      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editUser}
        onSuccess={handleFormSuccess}
      />
      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        user={resetUser}
        onSuccess={handleResetSuccess}
      />
    </div>
  )
}
