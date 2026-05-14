import { useState, useEffect, useCallback } from 'react'
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import { rolesApi } from '../api/users'
import {
  Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty,
} from '../components/ui/Table'

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

// ── Helpers ────────────────────────────────────────────────────
function formatTime(val) {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleString(undefined, {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

function ActionBadge({ action }) {
  const a = action?.toLowerCase() ?? ''
  const color =
    a.includes('delete') || a.includes('remove') ? 'text-danger bg-danger/10 border-danger/20' :
    a.includes('create') || a.includes('add')    ? 'text-success bg-success/10 border-success/20' :
    a.includes('update') || a.includes('edit')   ? 'text-accent bg-accent/10 border-accent/20' :
    'text-muted bg-surface border-border'

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', color)}>
      {action ?? '—'}
    </span>
  )
}

// ── Pagination ─────────────────────────────────────────────────
const LIMIT = 50

function Pagination({ page, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const from = (page - 1) * LIMIT + 1
  const to   = Math.min(page * LIMIT, total)

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-xs text-muted">
        {from}–{to} of {total} logs
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1
          return (
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
          )
        })}
        {totalPages > 7 && page < totalPages && (
          <button
            onClick={() => onChange(totalPages)}
            className="h-7 w-7 rounded-lg text-xs font-medium text-muted hover:text-text hover:bg-surface"
          >
            {totalPages}
          </button>
        )}
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

// ── Main page ──────────────────────────────────────────────────
export default function AuditLogsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission('audit_logs.view')) return <AccessDenied />

  return <AuditLogsInner />
}

function AuditLogsInner() {
  const [logs, setLogs]     = useState([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const data = await rolesApi.auditLogs(page)
    setLogs(data.logs ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Audit Logs</h1>
        <p className="text-sm text-muted mt-0.5">
          Track all user and role permission changes across the platform.
        </p>
      </div>

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th>Time</Th>
            <Th>User</Th>
            <Th>Action</Th>
            <Th>Resource</Th>
            <Th>IP Address</Th>
          </tr>
        </Thead>
        {loading ? (
          <TableSkeleton cols={5} rows={10} />
        ) : logs.length === 0 ? (
          <TableEmpty cols={5} message="No audit logs found." />
        ) : (
          <Tbody>
            {logs.map((log) => (
              <Tr key={log.id}>
                <Td muted className="whitespace-nowrap">{formatTime(log.created_at)}</Td>
                <Td>
                  <span className="text-sm font-medium text-text">{log.user_email ?? '—'}</span>
                </Td>
                <Td>
                  <ActionBadge action={log.action} />
                </Td>
                <Td muted>{log.resource_type ?? '—'}</Td>
                <Td muted className="font-mono text-xs">{log.ip_address ?? '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        )}
      </Table>

      <Pagination page={page} total={total} onChange={setPage} />
    </div>
  )
}
