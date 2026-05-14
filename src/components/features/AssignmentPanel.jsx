import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, Users } from 'lucide-react'
import clsx from 'clsx'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Toggle from '../ui/Toggle'
import Input from '../ui/Input'
import StatusDot from '../ui/StatusDot'
import { assignmentsApi } from '../../api/assignments'

/**
 * AssignmentPanel — modal that shows all MT5 accounts as selectable cards
 * for a given strategy, with per-account lot size and enable toggles.
 *
 * Props:
 *   open      — boolean
 *   onClose   — () => void
 *   strategy  — { id, name, ... }
 *   accounts  — MT5 account list from parent
 */
export default function AssignmentPanel({ open, onClose, strategy, accounts = [] }) {
  // Map: accountId -> { selected, enabled, lot_size, assignmentId }
  const [selections,  setSelections]  = useState({})
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const fetchAssignments = useCallback(async () => {
    if (!strategy?.id) return
    setLoading(true)
    setError('')
    try {
      const data = await assignmentsApi.list(strategy.id)
      const map = {}
      // Pre-seed all accounts as unselected
      accounts.forEach(a => {
        map[a.id] = { selected: false, enabled: true, lot_size: 0.1, assignmentId: null }
      })
      // Mark assigned accounts
      if (Array.isArray(data)) {
        data.forEach(a => {
          map[a.account_id] = {
            selected:     true,
            enabled:      a.enabled ?? true,
            lot_size:     a.lot_size ?? 0.1,
            assignmentId: a.id ?? null,
          }
        })
      }
      setSelections(map)
    } catch {
      setError('Failed to load assignments.')
    } finally {
      setLoading(false)
    }
  }, [strategy?.id, accounts])

  useEffect(() => {
    if (open) fetchAssignments()
  }, [open, fetchAssignments])

  const toggle = (accountId) => {
    setSelections(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        selected: !prev[accountId]?.selected,
      },
    }))
  }

  const setField = (accountId, field, value) => {
    setSelections(prev => ({
      ...prev,
      [accountId]: { ...prev[accountId], [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const ops = []
      for (const [accountIdStr, sel] of Object.entries(selections)) {
        const accountId = Number(accountIdStr)
        if (sel.selected && !sel.assignmentId) {
          // New assignment
          ops.push(
            assignmentsApi.add(strategy.id, {
              account_id: accountId,
              enabled:    sel.enabled,
              lot_size:   sel.lot_size,
            })
          )
        } else if (sel.selected && sel.assignmentId) {
          // Update existing
          ops.push(
            assignmentsApi.update(strategy.id, sel.assignmentId, {
              enabled:  sel.enabled,
              lot_size: sel.lot_size,
            })
          )
        } else if (!sel.selected && sel.assignmentId) {
          // Remove
          ops.push(assignmentsApi.remove(strategy.id, sel.assignmentId))
        }
      }
      await Promise.all(ops)
      onClose()
    } catch {
      setError('Failed to save assignments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = Object.values(selections).filter(s => s.selected).length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Assign MT5 Accounts — ${strategy?.name ?? ''}`}
      size="xl"
      footer={
        <>
          <span className="text-xs text-muted mr-auto">
            {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary"   onClick={handleSave} loading={saving}>Save Assignments</Button>
        </>
      }
    >
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-surface flex items-center justify-center">
              <Users size={20} className="text-muted" />
            </div>
            <p className="text-sm text-muted">No MT5 accounts found.<br />Add accounts first to assign them.</p>
          </div>
        ) : (
          accounts.map(account => {
            const sel = selections[account.id] ?? { selected: false, enabled: true, lot_size: 0.1 }
            const isSelected = sel.selected
            const eaRunning  = account.ea_status === 'running'

            return (
              <div
                key={account.id}
                onClick={() => toggle(account.id)}
                className={clsx(
                  'flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150',
                  isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-bg hover:bg-surface'
                )}
              >
                {/* Account header row */}
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div className={clsx(
                    'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? 'bg-accent border-accent' : 'border-border bg-bg'
                  )}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text truncate">{account.name}</span>
                      <Badge variant={account.account_type === 'real' ? 'success' : 'blue'}>
                        {account.account_type === 'real' ? 'Real' : 'Demo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                      <span>{account.broker_name}</span>
                      <span className="text-border">·</span>
                      <span className="font-mono">{account.login_number}</span>
                      {account.balance != null && (
                        <>
                          <span className="text-border">·</span>
                          <span className="text-text font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency ?? 'USD' }).format(account.balance)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* EA status dot */}
                  <StatusDot
                    status={eaRunning ? 'online' : 'offline'}
                    showLabel={false}
                    size="sm"
                  />
                </div>

                {/* Per-account options (shown when selected) */}
                {isSelected && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border/60"
                  >
                    <Input
                      label="Lot Size Override"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={sel.lot_size}
                      onChange={e => setField(account.id, 'lot_size', parseFloat(e.target.value) || 0.01)}
                      className="sm:w-40"
                    />
                    <div className="flex items-end gap-3">
                      <div className="flex items-center gap-2 pb-0.5">
                        <Toggle
                          checked={sel.enabled}
                          onChange={v => setField(account.id, 'enabled', v)}
                          label="Enable for this strategy"
                        />
                        <span className="text-xs text-muted">
                          {sel.enabled ? 'Enabled for strategy' : 'Disabled for strategy'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
